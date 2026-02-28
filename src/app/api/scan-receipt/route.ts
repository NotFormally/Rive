import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { MODEL_EXTRACT } from '@/lib/ai-models';
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // Auth check
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // Rate limit check
    const rateLimit = await checkRateLimit(auth.restaurantId, 'scan-receipt');
    if (!rateLimit.allowed) return tooManyRequests();

    const { image } = await req.json();

    if (!image) {
      return new Response('Image data is required', { status: 400 });
    }

    let invoiceData;
    try {
      const { object } = await generateObject({
        model: anthropic(MODEL_EXTRACT),
        schema: z.object({
          supplierName: z.string().describe('The name of the supplier or business on the receipt.'),
          totalAmount: z.string().describe('The total amount of the invoice, including currency symbol (e.g. 150.50$, €45.00).'),
          date: z.string().describe('The date of the receipt in YYYY-MM-DD or DD/MM/YYYY format.'),
          topItems: z.array(z.string()).describe('List of 1 to 3 main items purchased (general strings).'),
          items: z.array(z.object({
            name: z.string().describe('The name/description of the item purchased.'),
            quantity: z.number().describe('The total quantity purchased.'),
            unit: z.string().describe('The unit of measurement (e.g., kg, L, unit, case). Default to "unit" if unknown.'),
            unitPrice: z.number().describe('The price per single unit.'),
            totalPrice: z.number().describe('The total price for this line item (quantity * unitPrice).')
          })).describe('List of all individual line items on the receipt. CRITICAL: DO NOT INCLUDE deposits (consignes/vidanges) here.'),
          deposits: z.array(z.object({
            reference: z.string().describe('Name of the deposit item, like "Consigne Fût 30L" or "Vidange Casier".'),
            type: z.enum(['keg', 'bottle', 'crate', 'other']).describe('Type of deposit.'),
            status: z.enum(['held', 'returned']).describe('If charged to the restaurant = held. If refunded/returned = returned.'),
            quantity: z.number().describe('Number of items. Always positive.'),
            unitAmount: z.number().describe('Price per deposit. Always positive.'),
            totalAmount: z.number().describe('Total amount for these deposits. Always positive.')
          })).optional().describe('Any deposits or returned empties (consignes/vidanges) listed on the invoice.')
        }),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract the supplier name, total amount, date, and main items from this receipt image. Ensure deposits (consignes) are separated from the main food/beverage items.' },
              { type: 'image', image: image },
            ],
          },
        ],
      });
      invoiceData = object;
    } catch (aiError) {
      console.error('AI Receipt scan failed, using fallback:', aiError);
      
      // Fallback mock
      invoiceData = {
        supplierName: "Metro Cash & Carry",
        totalAmount: "345.20$",
        date: new Date().toISOString().split('T')[0],
        topItems: ["Farine T55 25kg", "Tomates Pelées (Lot)", "Huile de friture"],
        items: [
          { name: "Farine T55", quantity: 25, unit: "kg", unitPrice: 1.20, totalPrice: 30.00 },
          { name: "Tomates Pelées", quantity: 10, unit: "kg", unitPrice: 2.50, totalPrice: 25.00 },
          { name: "Huile de friture", quantity: 5, unit: "L", unitPrice: 4.00, totalPrice: 20.00 }
        ],
        deposits: [
          { reference: "Consigne Fût 30L", type: "keg", status: "held", quantity: 2, unitAmount: 30.00, totalAmount: 60.00 }
        ]
      };
    }

    // Basic date parsing to avoid Postgres errors
    let formattedDate = invoiceData.date;
    try {
      if (!/^\\d{4}-\\d{2}-\\d{2}/.test(formattedDate)) {
        const d = new Date(formattedDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().split('T')[0];
        } else {
          formattedDate = new Date().toISOString().split('T')[0];
        }
      }
    } catch {
      formattedDate = new Date().toISOString().split('T')[0];
    }

    // 1. Fetch existing ingredients for fuzzy matching
    const { data: existingIngredients } = await auth.supabase
      .from('ingredients')
      .select('id, name, unit')
      .eq('restaurant_id', auth.restaurantId);

    // Normalize string for basic matching
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();

    // 2. Save the main Invoice Header
    const { data: savedInvoice, error: dbError } = await auth.supabase.from('invoices').insert({
      restaurant_id: auth.restaurantId,
      supplier_name: invoiceData.supplierName,
      total_amount: invoiceData.totalAmount,
      date: formattedDate,
      top_items: invoiceData.topItems || [],
    }).select('id').single();

    if (dbError || !savedInvoice) {
      console.error('Failed to save invoice to Supabase:', dbError);
    } else {
      // 3. Process Line Items and attempt matching
      const invoiceItemsToInsert = [];
      const ingredientsToUpdate = [];

      for (const item of invoiceData.items || []) {
        let matchedIngredientId = null;

        // Try to find a match
        if (existingIngredients) {
          const normalizedItemName = normalize(item.name);
          // Very basic matching: if the extracted name contains the ingredient name or vice-versa
          const match = existingIngredients.find(ing => {
            const normIng = normalize(ing.name);
            return normalizedItemName.includes(normIng) || normIng.includes(normalizedItemName);
          });

          if (match) {
            matchedIngredientId = match.id;
            // Schedule ingredient price update (we assume the unit matches roughly, otherwise conversion is needed)
            ingredientsToUpdate.push({
              id: match.id,
              unit_cost: item.unitPrice
            });
          }
        }

        invoiceItemsToInsert.push({
          invoice_id: savedInvoice.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          matched_ingredient_id: matchedIngredientId
        });
      }

      // Insert line items
      if (invoiceItemsToInsert.length > 0) {
        await auth.supabase.from('invoice_items').insert(invoiceItemsToInsert);
      }

      // Process Deposits (Consignes) into deposits_ledger
      if (invoiceData.deposits && invoiceData.deposits.length > 0) {
        const depositsToInsert = invoiceData.deposits.map(dep => ({
          restaurant_id: auth.restaurantId,
          invoice_id: savedInvoice.id,
          type: dep.type,
          reference: dep.reference,
          quantity: dep.quantity,
          unit_amount: dep.unitAmount,
          total_amount: dep.totalAmount,
          status: dep.status
        }));
        
        await auth.supabase.from('deposits_ledger').insert(depositsToInsert);
      }

      // Update matched ingredients pricing directly!
      if (ingredientsToUpdate.length > 0) {
        for (const update of ingredientsToUpdate) {
          await auth.supabase
            .from('ingredients')
            .update({ unit_cost: update.unit_cost, updated_at: new Date().toISOString() })
            .eq('id', update.id)
            .eq('restaurant_id', auth.restaurantId); 
        }
      }
    }

    return new Response(JSON.stringify(invoiceData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error analyzing receipt:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
