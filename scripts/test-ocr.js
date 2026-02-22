import fs from 'fs';

async function testOCR() {
  try {
    const imagePath = process.argv[2];
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    console.log("Sending base64 image to localhost:3000/api/scan-receipt...");
    
    const res = await fetch('http://localhost:3000/api/scan-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image })
    });

    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));

  } catch (err) {
    console.error("Test failed:", err);
  }
}

testOCR();
