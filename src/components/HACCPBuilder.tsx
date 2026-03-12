"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus, 
  GripVertical, 
  Trash2, 
  Save, 
  Type, 
  Hash, 
  ToggleLeft, 
  Image as ImageIcon 
} from "lucide-react";

type FieldType = "text" | "number" | "boolean" | "image";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
}

export function HACCPBuilder() {
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations("HACCPBuilder");

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: t("new_field_label", { type }),
      required: false,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSave = async () => {
    if (!templateName.trim() || fields.length === 0) return;
    setIsSaving(true);
    
    const schema = { fields };
    
    // In a real implementation this would POST to an API or directly to Supabase
    console.log("Saving template:", { templateName, description, schema });
    
    // Simulate network delay
    setTimeout(() => {
      setIsSaving(false);
      alert(t("save_success"));
    }, 1000);
  };

  const renderIcon = (type: FieldType) => {
    switch (type) {
      case "text": return <Type className="w-4 h-4" />;
      case "number": return <Hash className="w-4 h-4" />;
      case "boolean": return <ToggleLeft className="w-4 h-4" />;
      case "image": return <ImageIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-start gap-4 justify-between flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-outfit font-bold text-white mb-2 tracking-tight">
            {t("page_title")}
          </h1>
          <p className="text-white/60 text-sm max-w-xl leading-relaxed">
            {t("page_description")}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!templateName.trim() || fields.length === 0 || isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
        >
          <Save className="w-4 h-4" />
          {isSaving ? t("btn_saving") : t("btn_save_template")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Form Settings & Fields */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">{t("label_template_name")}</label>
              <input 
                type="text" 
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={t("placeholder_template_name")}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">{t("label_description")}</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("placeholder_description")}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm min-h-[80px]"
              />
            </div>
          </div>

          {/* Fields Editor Area */}
          <div className="space-y-4">
            <h3 className="text-lg font-outfit font-medium text-white/90">{t("form_fields_title")} ({fields.length})</h3>
            
            {fields.length === 0 ? (
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center bg-[#1A1A1A]/50">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-white/40" />
                </div>
                <p className="text-white/60 font-medium mb-1">{t("empty_state_title")}</p>
                <p className="text-white/40 text-sm">{t("empty_state_description")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 flex items-start gap-4 group transition-all hover:border-white/20">
                    <div className="pt-2 cursor-grab text-white/20 hover:text-white/50">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-md text-xs font-medium text-white/70 uppercase">
                          {renderIcon(field.type)}
                          {field.type}
                        </div>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="flex-1 bg-transparent border-b border-white/10 focus:border-blue-500 px-1 py-1 text-white text-sm focus:outline-none transition-colors min-w-[150px]"
                          placeholder={t("placeholder_field_name")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                         <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                            />
                            {t("label_required_field")}
                         </label>
                      </div>
                    </div>

                    <button 
                      onClick={() => removeField(field.id)}
                      className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Toolbox */}
        <div className="lg:col-span-1">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 md:sticky md:top-6">
            <h3 className="text-sm font-outfit font-semibold text-white/90 mb-4 uppercase tracking-wider">{t("toolbox_title")}</h3>
            <div className="space-y-2 grid grid-cols-2 lg:grid-cols-1 gap-2">
              <button 
                onClick={() => addField("number")}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90">{t("field_number")}</div>
                  <div className="text-xs text-white/50 hidden md:block">{t("field_number_desc")}</div>
                </div>
              </button>
              
              <button 
                onClick={() => addField("boolean")}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                  <ToggleLeft className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90">{t("field_boolean")}</div>
                  <div className="text-xs text-white/50 hidden md:block">{t("field_boolean_desc")}</div>
                </div>
              </button>

              <button 
                onClick={() => addField("text")}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90">{t("field_text")}</div>
                  <div className="text-xs text-white/50 hidden md:block">{t("field_text_desc")}</div>
                </div>
              </button>

              <button 
                onClick={() => addField("image")}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90">{t("field_image")}</div>
                  <div className="text-xs text-white/50 hidden md:block">{t("field_image_desc")}</div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
