"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Plus,
  GripVertical,
  Trash2,
  Type,
  Hash,
  ToggleLeft,
  Image as ImageIcon,
  CheckCircle2,
  Camera,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Play,
} from "lucide-react";

/* ── Types ── */
type FieldType = "text" | "number" | "boolean" | "image";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
}

/* ── Pre-loaded demo template ── */
const DEMO_FIELDS: FormField[] = [
  { id: "temp_coeur", type: "number", label: "", required: true },
  { id: "etat_produit", type: "boolean", label: "", required: true },
  { id: "observations", type: "text", label: "", required: false },
  { id: "photo_etiquette", type: "image", label: "", required: true },
];

type DemoStep = "build" | "audit" | "done";

export default function HACCPDemoPage() {
  const t = useTranslations("HACCPDemo");
  const tb = useTranslations("HACCPBuilder");
  const ta = useTranslations("HACCPAudit");

  const [step, setStep] = useState<DemoStep>("build");

  // Builder state
  const [templateName, setTemplateName] = useState(t("demo_template_name"));
  const [description, setDescription] = useState(t("demo_template_desc"));
  const [fields, setFields] = useState<FormField[]>(
    DEMO_FIELDS.map((f) => ({
      ...f,
      label: t(`demo_field_${f.id}`),
    }))
  );

  // Audit state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);

  /* ── Builder helpers ── */
  const addField = (type: FieldType) => {
    setFields([
      ...fields,
      {
        id: `field_${Date.now()}`,
        type,
        label: tb("new_field_label", { type }),
        required: false,
      },
    ]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const renderIcon = (type: FieldType) => {
    switch (type) {
      case "text": return <Type className="w-4 h-4" />;
      case "number": return <Hash className="w-4 h-4" />;
      case "boolean": return <ToggleLeft className="w-4 h-4" />;
      case "image": return <ImageIcon className="w-4 h-4" />;
    }
  };

  /* ── Audit helpers ── */
  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      const newErrors = { ...errors };
      delete newErrors[fieldId];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    fields.forEach((field) => {
      if (field.required && (formData[field.id] === undefined || formData[field.id] === "")) {
        newErrors[field.id] = ta("error_required");
        isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setSubmittedData(formData);
      setIsSubmitting(false);
      setStep("done");
    }, 800);
  };

  const resetDemo = () => {
    setStep("build");
    setFormData({});
    setErrors({});
    setSubmittedData(null);
    setTemplateName(t("demo_template_name"));
    setDescription(t("demo_template_desc"));
    setFields(
      DEMO_FIELDS.map((f) => ({
        ...f,
        label: t(`demo_field_${f.id}`),
      }))
    );
  };

  /* ── Step indicator ── */
  const steps = [
    { key: "build", label: t("step_build"), num: 1 },
    { key: "audit", label: t("step_audit"), num: 2 },
    { key: "done", label: t("step_done"), num: 3 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-[#0B0F15]">
      {/* Header bar */}
      <div className="bg-[#0B131E] border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h1 className="text-white font-bold font-jakarta text-lg">{t("page_title")}</h1>
              <p className="text-white/50 text-xs font-plex-mono">{t("page_badge")}</p>
            </div>
          </div>
          <Link
            href="/signup"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-bold rounded-xl transition-colors"
          >
            {t("cta_signup")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Step indicator */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i <= currentStepIndex
                    ? "bg-cyan-500 text-white"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {i < currentStepIndex ? "✓" : s.num}
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  i <= currentStepIndex ? "text-white" : "text-white/40"
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    i < currentStepIndex ? "bg-cyan-500" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ═══════════════ STEP 1: BUILD ═══════════════ */}
        {step === "build" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white font-jakarta mb-2">{t("build_title")}</h2>
              <p className="text-white/60 max-w-xl mx-auto">{t("build_desc")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Fields area */}
              <div className="lg:col-span-3 space-y-6">
                {/* Template info */}
                <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">{tb("label_template_name")}</label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder={tb("placeholder_template_name")}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">{tb("label_description")}</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={tb("placeholder_description")}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm min-h-[80px]"
                    />
                  </div>
                </div>

                {/* Fields list */}
                <div className="space-y-4">
                  <h3 className="text-lg font-outfit font-medium text-white/90">
                    {tb("form_fields_title")} ({fields.length})
                  </h3>

                  {fields.length === 0 ? (
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center bg-[#1A1A1A]/50">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Plus className="w-6 h-6 text-white/40" />
                      </div>
                      <p className="text-white/60 font-medium mb-1">{tb("empty_state_title")}</p>
                      <p className="text-white/40 text-sm">{tb("empty_state_description")}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fields.map((field) => (
                        <div
                          key={field.id}
                          className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 flex items-start gap-4 group transition-all hover:border-white/20"
                        >
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
                                className="flex-1 bg-transparent border-b border-white/10 focus:border-cyan-500 px-1 py-1 text-white text-sm focus:outline-none transition-colors min-w-[150px]"
                                placeholder={tb("placeholder_field_name")}
                              />
                            </div>
                            <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                className="rounded border-white/20 bg-black/50 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0"
                              />
                              {tb("label_required_field")}
                            </label>
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

                {/* Next step button */}
                <button
                  onClick={() => setStep("audit")}
                  disabled={fields.length === 0 || !templateName.trim()}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:scale-[1.01] transition-transform shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-jakarta"
                >
                  <Play className="w-5 h-5" />
                  {t("btn_test_audit")}
                </button>
              </div>

              {/* Toolbox */}
              <div className="lg:col-span-1">
                <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 lg:sticky lg:top-24">
                  <h3 className="text-sm font-outfit font-semibold text-white/90 mb-4 uppercase tracking-wider">
                    {tb("toolbox_title")}
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    {(
                      [
                        { type: "number" as FieldType, color: "orange" },
                        { type: "boolean" as FieldType, color: "emerald" },
                        { type: "text" as FieldType, color: "blue" },
                        { type: "image" as FieldType, color: "purple" },
                      ] as const
                    ).map(({ type, color }) => (
                      <button
                        key={type}
                        onClick={() => addField(type)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left group"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center text-${color}-400 group-hover:scale-110 transition-transform shrink-0`}
                        >
                          {renderIcon(type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white/90">{tb(`field_${type}`)}</div>
                          <div className="text-xs text-white/50 hidden md:block">{tb(`field_${type}_desc`)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 2: AUDIT ═══════════════ */}
        {step === "audit" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white font-jakarta mb-2">{t("audit_title")}</h2>
              <p className="text-white/60 max-w-xl mx-auto">{t("audit_desc")}</p>
            </div>

            <form onSubmit={handleAuditSubmit} className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-outfit font-bold text-white">{templateName}</h3>
              </div>

              {fields.map((field) => {
                const errorMsg = errors[field.id];
                const value = formData[field.id] ?? "";

                return (
                  <div key={field.id} className="bg-[#111111] border border-gray-800 rounded-2xl p-5 md:p-6 shadow-xl">
                    <label className="flex items-center gap-2 text-white font-medium mb-4">
                      {field.label}
                      {field.required && <span className="text-red-400 text-lg leading-none">*</span>}
                    </label>

                    {field.type === "text" && (
                      <div className="space-y-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Type className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            placeholder={ta("placeholder_text")}
                            className={`block w-full pl-10 pr-3 py-3 border ${errorMsg ? "border-red-500" : "border-gray-700"} rounded-xl bg-[#1A1A1A] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                          />
                        </div>
                        {errorMsg && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {errorMsg}
                          </p>
                        )}
                      </div>
                    )}

                    {field.type === "number" && (
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
                            className={`block w-full pl-10 pr-3 py-3 border ${errorMsg ? "border-red-500" : "border-gray-700"} rounded-xl bg-[#1A1A1A] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                          />
                        </div>
                        {errorMsg && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {errorMsg}
                          </p>
                        )}
                      </div>
                    )}

                    {field.type === "boolean" && (
                      <div className="space-y-2">
                        <div className={`p-4 rounded-xl border ${errorMsg ? "border-red-500" : "border-gray-700"} bg-[#1A1A1A]`}>
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="radio"
                                name={field.id}
                                checked={formData[field.id] === true}
                                onChange={() => handleInputChange(field.id, true)}
                                className="w-5 h-5 text-emerald-500 bg-gray-800 border-gray-600 focus:ring-emerald-500"
                              />
                              <span className="text-white group-hover:text-emerald-400 transition-colors">{ta("label_yes")}</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="radio"
                                name={field.id}
                                checked={formData[field.id] === false}
                                onChange={() => handleInputChange(field.id, false)}
                                className="w-5 h-5 text-red-500 bg-gray-800 border-gray-600 focus:ring-red-500"
                              />
                              <span className="text-white group-hover:text-red-400 transition-colors">{ta("label_no")}</span>
                            </label>
                          </div>
                        </div>
                        {errorMsg && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {errorMsg}
                          </p>
                        )}
                      </div>
                    )}

                    {field.type === "image" && (
                      <div className="space-y-2">
                        <div
                          className={`border-2 border-dashed ${errorMsg ? "border-red-500/50 bg-red-500/5" : "border-gray-700 bg-[#1A1A1A]/50"} rounded-xl p-8 hover:bg-[#1A1A1A] transition-colors cursor-pointer group flex flex-col items-center justify-center`}
                          onClick={() => handleInputChange(field.id, "photo_demo.jpg")}
                        >
                          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Camera className="w-6 h-6 text-gray-400 group-hover:text-cyan-400" />
                          </div>
                          <p className="text-gray-400 font-medium group-hover:text-white transition-colors">{ta("capture_photo")}</p>
                          <p className="text-gray-500 text-xs mt-1">{t("demo_click_simulate")}</p>
                        </div>
                        {value && (
                          <p className="text-emerald-400 text-xs flex items-center gap-1.5 mt-2">
                            <CheckCircle2 className="w-4 h-4" /> {ta("file_attached", { name: value })}
                          </p>
                        )}
                        {errorMsg && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {errorMsg}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("build")}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/10"
                >
                  {t("btn_back")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6" />
                      {ta("btn_submit")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ═══════════════ STEP 3: DONE ═══════════════ */}
        {step === "done" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-3xl">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-white font-outfit">{t("done_title")}</h2>
              <p className="text-white/70">{t("done_desc")}</p>
            </div>

            {submittedData && (
              <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-plex-mono text-white/50 uppercase tracking-wider mb-4">{t("done_payload")}</h3>
                <pre className="bg-black/50 p-4 rounded-xl text-emerald-400 text-sm overflow-x-auto border border-white/5">
                  {JSON.stringify(submittedData, null, 2)}
                </pre>
              </div>
            )}

            {/* CTA: Sign up to save */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-8 text-center space-y-4">
              <h3 className="text-xl font-bold text-white font-jakarta">{t("cta_title")}</h3>
              <p className="text-white/60 max-w-md mx-auto">{t("cta_desc")}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20 font-jakarta"
                >
                  {t("cta_signup")} <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={resetDemo}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/10"
                >
                  <RotateCcw className="w-4 h-4" /> {t("cta_restart")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
