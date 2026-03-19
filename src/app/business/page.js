"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/LanguageProvider";

const G = "linear-gradient(135deg,#f97316,#ec4899)";

// GSA per diem rates (approximate USD/day)
const PER_DIEM = {
  "New York": { hotel: 298, meals: 79 },
  "San Francisco": { hotel: 285, meals: 79 },
  "Los Angeles": { hotel: 258, meals: 79 },
  "Chicago": { hotel: 233, meals: 79 },
  "Washington DC": { hotel: 258, meals: 79 },
  "London": { hotel: 310, meals: 95 },
  "Paris": { hotel: 295, meals: 90 },
  "Tokyo": { hotel: 260, meals: 85 },
  "Dubai": { hotel: 240, meals: 80 },
  "Tel Aviv": { hotel: 220, meals: 75 },
  "Berlin": { hotel: 200, meals: 70 },
  "Amsterdam": { hotel: 220, meals: 75 },
  "Singapore": { hotel: 250, meals: 85 },
  "Sydney": { hotel: 230, meals: 80 },
  "Other": { hotel: 180, meals: 65 },
};

const EXPENSE_CATS = [
  { id: "flights", label: "✈️ Flights", color: "#6366f1" },
  { id: "hotel", label: "🏨 Hotel", color: "#0ea5e9" },
  { id: "meals", label: "🍽️ Meals", color: "#f59e0b" },
  { id: "transport", label: "🚗 Transport", color: "#10b981" },
  { id: "other", label: "📎 Other", color: "#8b5cf6" },
];

function getExpenses() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("aigency_business_expenses") || "[]"); }
  catch { return []; }
}
function saveExpenses(list) {
  localStorage.setItem("aigency_business_expenses", JSON.stringify(list));
}

export default function BusinessPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("perdiem");
  const [city, setCity] = useState("New York");
  const [days, setDays] = useState(3);
  const [expenses, setExpenses] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [newExp, setNewExp] = useState({ description: "", amount: "", category: "meals", date: new Date().toISOString().slice(0, 10) });
  const [addingExp, setAddingExp] = useState(false);

  useEffect(() => {
    setMounted(true);
    setExpenses(getExpenses());
  }, []);

  const rates = PER_DIEM[city] || PER_DIEM["Other"];
  const totalHotel = rates.hotel * days;
  const totalMeals = rates.meals * days;
  const totalPerDiem = totalHotel + totalMeals;

  function addExpense() {
    if (!newExp.description || !newExp.amount) return;
    const list = [...expenses, { ...newExp, amount: parseFloat(newExp.amount), id: Date.now() }];
    setExpenses(list);
    saveExpenses(list);
    setNewExp({ description: "", amount: "", category: "meals", date: new Date().toISOString().slice(0, 10) });
    setAddingExp(false);
  }
  function removeExpense(id) {
    const list = expenses.filter(e => e.id !== id);
    setExpenses(list);
    saveExpenses(list);
  }

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const byCategory = EXPENSE_CATS.map(c => ({
    ...c,
    total: expenses.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0),
  }));

  function exportCSV() {
    const rows = [["Date", "Description", "Category", "Amount"], ...expenses.map(e => [e.date, e.description, e.category, e.amount])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "expenses.csv"; a.click();
  }

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <div className="px-4 sm:px-6 pt-8 pb-4 max-w-2xl mx-auto">
        {/* Header */}
        <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">{t("business_label")}</p>
        <h1 className="text-3xl font-black text-gray-900 mb-5">{t("business_title")}</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[{ id: "perdiem", label: "💰 Per Diem" }, { id: "expenses", label: "📊 Expenses" }].map(tab_item => (
            <button key={tab_item.id} onClick={() => setTab(tab_item.id)}
              className="px-5 py-2.5 rounded-2xl text-sm font-black transition-all"
              style={tab === tab_item.id
                ? { background: G, color: "white", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }
                : { background: "white", color: "#9ca3af", border: "2px solid #fed7aa" }}>
              {tab_item.label}
            </button>
          ))}
        </div>

        {/* Per Diem Calculator */}
        {tab === "perdiem" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-orange-100 p-5 shadow-sm">
              <h2 className="font-black text-gray-900 mb-4">{t("business_calculator")}</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5 block">{t("select_city")}</label>
                  <select value={city} onChange={e => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 text-sm font-bold text-gray-700 bg-white outline-none focus:border-orange-300">
                    {Object.keys(PER_DIEM).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5 block">{t("num_days")}</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setDays(d => Math.max(1, d - 1))}
                      className="w-10 h-10 rounded-xl bg-orange-50 font-black text-orange-500 text-xl flex items-center justify-center hover:bg-orange-100 transition-colors">−</button>
                    <span className="text-2xl font-black text-gray-900 w-8 text-center">{days}</span>
                    <button onClick={() => setDays(d => d + 1)}
                      className="w-10 h-10 rounded-xl bg-orange-50 font-black text-orange-500 text-xl flex items-center justify-center hover:bg-orange-100 transition-colors">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="rounded-3xl p-5 text-white relative overflow-hidden" style={{ background: G }}>
              <div className="absolute top-0 right-0 text-8xl opacity-10 font-black -mt-2 -mr-2">💼</div>
              <div className="relative">
                <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-3">{t("grand_total")} — {days} days in {city}</p>
                <div className="text-4xl font-black mb-4">${totalPerDiem.toLocaleString()}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/20 rounded-2xl p-3">
                    <div className="text-white/70 text-xs font-bold mb-1">🏨 {t("total_hotel")}</div>
                    <div className="font-black">${totalHotel.toLocaleString()}</div>
                    <div className="text-white/60 text-xs">${rates.hotel}/night</div>
                  </div>
                  <div className="bg-white/20 rounded-2xl p-3">
                    <div className="text-white/70 text-xs font-bold mb-1">🍽️ {t("total_meals")}</div>
                    <div className="font-black">${totalMeals.toLocaleString()}</div>
                    <div className="text-white/60 text-xs">${rates.meals}/day</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-600">Note:</strong> {t("per_diem_note")}
              </p>
            </div>
          </div>
        )}

        {/* Expense Tracker */}
        {tab === "expenses" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-3xl p-5 text-white relative overflow-hidden" style={{ background: G }}>
              <div className="absolute top-0 right-0 text-8xl opacity-10 font-black -mt-2 -mr-2">📊</div>
              <div className="relative">
                <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">{t("total_spent")}</p>
                <div className="text-4xl font-black mb-4">${totalExpenses.toFixed(2)}</div>
                <div className="flex gap-2 flex-wrap">
                  {byCategory.filter(c => c.total > 0).map(c => (
                    <div key={c.id} className="bg-white/20 rounded-xl px-3 py-1.5 text-xs font-bold">
                      {c.label} ${c.total.toFixed(0)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => setAddingExp(true)}
                className="flex-1 py-3 rounded-2xl font-black text-white text-sm shadow-md" style={{ background: G }}>
                {t("add_expense")}
              </button>
              {expenses.length > 0 && (
                <button onClick={exportCSV}
                  className="py-3 px-4 rounded-2xl font-black text-sm border-2 border-orange-100 text-orange-500 bg-white hover:bg-orange-50 transition-colors">
                  {t("export_csv_btn")}
                </button>
              )}
            </div>

            {/* Add form */}
            {addingExp && (
              <div className="bg-white rounded-3xl border border-orange-100 p-5 shadow-sm space-y-3">
                <h3 className="font-black text-gray-900">{t("add_expense")}</h3>
                <input value={newExp.description} onChange={e => setNewExp(p => ({ ...p, description: e.target.value }))}
                  placeholder={t("expense_name")}
                  className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 text-sm font-medium text-gray-700 outline-none focus:border-orange-300" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={newExp.amount} onChange={e => setNewExp(p => ({ ...p, amount: e.target.value }))}
                    placeholder="Amount ($)" type="number" min="0"
                    className="px-4 py-3 rounded-xl border-2 border-orange-100 text-sm font-medium text-gray-700 outline-none focus:border-orange-300" />
                  <input value={newExp.date} onChange={e => setNewExp(p => ({ ...p, date: e.target.value }))}
                    type="date"
                    className="px-4 py-3 rounded-xl border-2 border-orange-100 text-sm font-medium text-gray-700 outline-none focus:border-orange-300" />
                </div>
                <select value={newExp.category} onChange={e => setNewExp(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 text-sm font-bold text-gray-700 bg-white outline-none focus:border-orange-300">
                  {EXPENSE_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={addExpense}
                    className="flex-1 py-3 rounded-xl font-black text-white text-sm" style={{ background: G }}>
                    {t("save")}
                  </button>
                  <button onClick={() => setAddingExp(false)}
                    className="flex-1 py-3 rounded-xl font-black text-sm border-2 border-gray-200 text-gray-400">
                    {t("cancel")}
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            {expenses.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-orange-100">
                <div className="text-5xl mb-3">📋</div>
                <p className="font-black text-gray-900 mb-1">{t("no_expenses")}</p>
                <p className="text-sm text-gray-400">{t("no_expenses_sub")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...expenses].reverse().map(e => {
                  const cat = EXPENSE_CATS.find(c => c.id === e.category);
                  return (
                    <div key={e.id} className="flex items-center gap-3 bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: `${cat?.color || "#10b981"}15` }}>
                        {cat?.label.split(" ")[0] || "📎"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-gray-900 text-sm truncate">{e.description}</div>
                        <div className="text-xs text-gray-400">{e.date} · {cat?.label || e.category}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="font-black text-sm" style={{ color: cat?.color || "#10b981" }}>${e.amount.toFixed(2)}</div>
                        <button onClick={() => removeExpense(e.id)}
                          className="text-xs px-2 py-1 rounded-lg border border-red-100 text-red-300 hover:text-red-500 hover:bg-red-50 transition-all">
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
