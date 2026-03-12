"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2, 
  Camera, 
  Hash, 
  Type, 
  AlertTriangle 
} from "lucide-react";

type FieldType = "text" | "number" | "boolean" | "image";

export interface HACCPFormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
}

export interface HACCPTemplateSchema {
  fields: HACCPFormField[];
}

interface HACCPAuditRunnerProps {
  templateName: string;
  schema: HACCPTemplateSchema;
  onSubmit: (data: Record<string, any>) => void;
}

export function HACCPAuditRunner({ templateName, schema, onSubmit }: HACCPAuditRunnerProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("HACCPAudit");

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear error if exists
    if (errors[fieldId]) {
      const newErrors = { ...errors };
      delete newErrors[fieldId];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    schema.fields.forEach(field => {
      if (field.required && (formData[field.id] === undefined || formData[field.id] === "")) {
        newErrors[field.id] = t("error_required");
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      onSubmit(formData);
      setIsSubmitting(false);
    }, 1000);
  };

  const renderField = (field: HACCPFormField) => {
    const errorMsg = errors[field.id];
    const value = formData[field.id] || "";

    switch (field.type) {
      case "text":
        return (
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Type className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder={t("placeholder_text")}
                className={`block w-full pl-10 pr-3 py-3 border ${errorMsg ? 'border-red-500' : 'border-gray-700'} rounded-xl bg-[#1A1A1A] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow transition-colors`}
              />
            </div>
            {errorMsg && <p className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {errorMsg}</p>}
          </div>
        );

      case "number":
        return (
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => handleInputChange(field.id, parseFloat(e.target.value))}
                placeholder="0.0"
                className={`block w-full pl-10 pr-3 py-3 border ${errorMsg ? 'border-red-500' : 'border-gray-700'} rounded-xl bg-[#1A1A1A] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow transition-colors`}
              />
            </div>
            {errorMsg && <p className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {errorMsg}</p>}
          </div>
        );

      case "boolean":
        return (
          <div className="space-y-2">
            <div className={`p-4 rounded-xl border ${errorMsg ? 'border-red-500' : 'border-gray-700'} bg-[#1A1A1A]`}>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name={field.id}
                    checked={formData[field.id] === true}
                    onChange={() => handleInputChange(field.id, true)}
                    className="w-5 h-5 text-emerald-500 bg-gray-800 border-gray-600 focus:ring-emerald-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-white group-hover:text-emerald-400 transition-colors">{t("label_yes")}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name={field.id}
                    checked={formData[field.id] === false}
                    onChange={() => handleInputChange(field.id, false)}
                    className="w-5 h-5 text-red-500 bg-gray-800 border-gray-600 focus:ring-red-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-white group-hover:text-red-400 transition-colors">{t("label_no")}</span>
                </label>
              </div>
            </div>
            {errorMsg && <p className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {errorMsg}</p>}
          </div>
        );

      case "image":
        return (
          <div className="space-y-2">
             <div className={`border-2 border-dashed ${errorMsg ? 'border-red-500/50 bg-red-500/5' : 'border-gray-700 bg-[#1A1A1A]/50'} rounded-xl p-8 hover:bg-[#1A1A1A] transition-colors cursor-pointer group flex flex-col items-center justify-center`}>
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6 text-gray-400 group-hover:text-blue-400" />
                </div>
                <p className="text-gray-400 font-medium group-hover:text-white transition-colors">{t("capture_photo")}</p>
                <p className="text-gray-500 text-xs mt-1">{t("camera_mobile")}</p>
                {/* Simulated file input for the mockup */}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                     if(e.target.files?.[0]) {
                        handleInputChange(field.id, e.target.files[0].name); // Mockup logic
                     }
                  }}
                />
             </div>
             {value && <p className="text-emerald-400 text-xs flex items-center gap-1.5 mt-2"><CheckCircle2 className="w-4 h-4" /> {t("file_attached", { name: value })}</p>}
             {errorMsg && <p className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {errorMsg}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Form */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-outfit font-bold text-white tracking-tight">{templateName}</h2>
        <p className="text-gray-400 text-sm">{t("instructions")}</p>
      </div>

      <div className="space-y-6">
        {schema.fields.map((field) => (
          <div key={field.id} className="bg-[#111111] border border-gray-800 rounded-2xl p-5 md:p-6 shadow-xl">
            <label className="flex items-center gap-2 text-white font-medium mb-4">
              {field.label}
              {field.required && <span className="text-red-400 text-lg leading-none">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Signature & Validation */}
      <div className="pt-6 border-t border-gray-800">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
             <>
               <CheckCircle2 className="w-6 h-6" />
               {t("btn_submit")}
             </>
          )}
        </button>
        <p className="text-center text-gray-500 text-xs mt-4 font-plex-mono">
           {t("disclaimer")}
        </p>
      </div>

    </form>
  );
}
