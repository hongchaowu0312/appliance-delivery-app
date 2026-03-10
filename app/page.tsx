"use client";

import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "../lib/supabase";

type Delivery = {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  appliance: string;
  delivery_date: string;
  install: boolean;
  paid: boolean;
  driver: string;
  notes: string;
  sort_order: number | null;
  completed?: boolean | null;
  completed_at?: string | null;
};

type Language = "en" | "zh" | "es";

type FormState = {
  customer_name: string;
  phone: string;
  address: string;
  appliance: string;
  delivery_date: string;
  install: boolean;
  paid: boolean;
  driver: string;
  notes: string;
};

const texts = {
  en: {
    appTitle: "Appliance Delivery Manager",
    todayDeliveries: "Today's Deliveries",
    deliveriesFor: "Deliveries for",
    totalOrders: "Total Orders",
    newDelivery: "+ New Delivery",
    hideForm: "Hide Form",
    addDelivery: "Add Delivery",
    customerName: "Customer Name",
    phone: "Phone",
    address: "Address",
    appliance: "Appliance",
    date: "Date",
    driver: "Driver",
    notes: "Notes",
    install: "Install",
    paid: "Paid",
    saveDelivery: "Save Delivery",
    updateDelivery: "Update Delivery",
    noDeliveries: "No deliveries for this day",
    call: "Call",
    navigate: "Navigate",
    copyAddress: "Copy Address",
    edit: "Edit",
    moveUp: "Move Up",
    moveDown: "Move Down",
    completed: "Completed",
    status: "Status",
    open: "Open",
    done: "Done",
    copied: "Address copied",
  },
  zh: {
    appTitle: "家电送货管理",
    todayDeliveries: "今天送货",
    deliveriesFor: "当天送货",
    totalOrders: "总单数",
    newDelivery: "+ 新建送货单",
    hideForm: "隐藏表单",
    addDelivery: "添加送货单",
    customerName: "客户姓名",
    phone: "电话",
    address: "地址",
    appliance: "家电",
    date: "日期",
    driver: "司机",
    notes: "备注",
    install: "安装",
    paid: "已付款",
    saveDelivery: "保存送货单",
    updateDelivery: "更新送货单",
    noDeliveries: "这一天没有送货单",
    call: "拨打",
    navigate: "导航",
    copyAddress: "复制地址",
    edit: "编辑",
    moveUp: "上移",
    moveDown: "下移",
    completed: "已完成",
    status: "状态",
    open: "进行中",
    done: "已完成",
    copied: "地址已复制",
  },
  es: {
    appTitle: "Administrador de Entregas",
    todayDeliveries: "Entregas de Hoy",
    deliveriesFor: "Entregas para",
    totalOrders: "Total de Órdenes",
    newDelivery: "+ Nueva Entrega",
    hideForm: "Ocultar Formulario",
    addDelivery: "Agregar Entrega",
    customerName: "Nombre del Cliente",
    phone: "Teléfono",
    address: "Dirección",
    appliance: "Electrodoméstico",
    date: "Fecha",
    driver: "Chofer",
    notes: "Notas",
    install: "Instalación",
    paid: "Pagado",
    saveDelivery: "Guardar Entrega",
    updateDelivery: "Actualizar Entrega",
    noDeliveries: "No hay entregas para este día",
    call: "Llamar",
    navigate: "Navegar",
    copyAddress: "Copiar Dirección",
    edit: "Editar",
    moveUp: "Subir",
    moveDown: "Bajar",
    completed: "Completado",
    status: "Estado",
    open: "Abierto",
    done: "Hecho",
    copied: "Dirección copiada",
  },
};

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyForm(date: string): FormState {
  return {
    customer_name: "",
    phone: "",
    address: "",
    appliance: "",
    delivery_date: date,
    install: false,
    paid: false,
    driver: "",
    notes: "",
  };
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const t = texts[language];

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm(formatDateLocal(new Date())));

  const selectedDateString = formatDateLocal(selectedDate);

  async function fetchDeliveries() {
    const { data, error } = await supabase
      .from("deliveries")
      .select("*")
      .order("delivery_date", { ascending: true })
      .order("completed", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    setDeliveries((data as Delivery[]) || []);
  }

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    if (!editingId) {
      setForm((prev) => ({
        ...prev,
        delivery_date: selectedDateString,
      }));
    }
  }, [selectedDateString, editingId]);

  const countsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of deliveries) {
      map[d.delivery_date] = (map[d.delivery_date] || 0) + 1;
    }
    return map;
  }, [deliveries]);

  const selectedDayDeliveries = useMemo(() => {
    const list = deliveries.filter((d) => d.delivery_date === selectedDateString);

    const openItems = list
      .filter((d) => !d.completed)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const completedItems = list
      .filter((d) => d.completed)
      .sort((a, b) => {
        const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return aTime - bTime;
      });

    return [...openItems, ...completedItems];
  }, [deliveries, selectedDateString]);

  async function resequenceDay(day: string, orderedOpenItems: Delivery[]) {
    for (let i = 0; i < orderedOpenItems.length; i++) {
      const item = orderedOpenItems[i];
      const { error } = await supabase
        .from("deliveries")
        .update({ sort_order: i + 1 })
        .eq("id", item.id);

      if (error) {
        console.error("Resequence error:", error);
      }
    }

    await fetchDeliveries();
  }

  async function moveDelivery(id: number, direction: "up" | "down") {
    const openItems = selectedDayDeliveries.filter((d) => !d.completed);
    const index = openItems.findIndex((d) => d.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === openItems.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [openItems[index], openItems[targetIndex]] = [openItems[targetIndex], openItems[index]];

    await resequenceDay(selectedDateString, openItems);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.customer_name || !form.phone || !form.address || !form.appliance) {
      alert("Please fill required fields");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("deliveries")
        .update({
          customer_name: form.customer_name,
          phone: form.phone,
          address: form.address,
          appliance: form.appliance,
          delivery_date: form.delivery_date,
          install: form.install,
          paid: form.paid,
          driver: form.driver,
          notes: form.notes,
        })
        .eq("id", editingId);

      if (error) {
        console.error("Update error:", error);
        alert("Update failed");
        return;
      }
    } else {
      const sameDay = deliveries.filter(
        (d) => d.delivery_date === form.delivery_date && !d.completed
      );
      const nextSortOrder = sameDay.length + 1;

      const { error } = await supabase.from("deliveries").insert([
        {
          customer_name: form.customer_name,
          phone: form.phone,
          address: form.address,
          appliance: form.appliance,
          delivery_date: form.delivery_date,
          install: form.install,
          paid: form.paid,
          driver: form.driver,
          notes: form.notes,
          sort_order: nextSortOrder,
          completed: false,
        },
      ]);

      if (error) {
        console.error("Insert error:", error);
        alert("Save failed");
        return;
      }
    }

    setEditingId(null);
    setShowForm(false);
    setForm(emptyForm(selectedDateString));
    await fetchDeliveries();
  }

  function startEdit(delivery: Delivery) {
    setEditingId(delivery.id);
    setShowForm(true);
    setForm({
      customer_name: delivery.customer_name || "",
      phone: delivery.phone || "",
      address: delivery.address || "",
      appliance: delivery.appliance || "",
      delivery_date: delivery.delivery_date || selectedDateString,
      install: !!delivery.install,
      paid: !!delivery.paid,
      driver: delivery.driver || "",
      notes: delivery.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleCompleted(delivery: Delivery) {
    const nextCompleted = !delivery.completed;

    const payload = nextCompleted
      ? {
          completed: true,
          completed_at: new Date().toISOString(),
        }
      : {
          completed: false,
          completed_at: null,
        };

    const { error } = await supabase
      .from("deliveries")
      .update(payload)
      .eq("id", delivery.id);

    if (error) {
      console.error("Complete toggle error:", error);
      return;
    }

    await fetchDeliveries();
  }

  function handleCall(phone: string) {
    window.location.href = `tel:${phone}`;
  }

  function handleNavigate(address: string) {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
  }

  async function handleCopyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopyMessage(t.copied);
      setTimeout(() => setCopyMessage(""), 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  function tileContent({ date, view }: { date: Date; view: string }) {
    if (view !== "month") return null;
    const key = formatDateLocal(date);
    const count = countsByDate[key] || 0;
    if (!count) return null;
    return <div className="calendar-count">{count}</div>;
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0 }}>{t.todayDeliveries}</h1>
          <div style={{ color: "#666", marginTop: 4 }}>
            {t.deliveriesFor}: {selectedDateString}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              border: "1px solid #ddd",
              borderRadius: 999,
              overflow: "hidden",
              fontSize: 14,
            }}
          >
            {(["en", "zh", "es"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                style={{
                  padding: "8px 12px",
                  border: "none",
                  background: language === lang ? "black" : "white",
                  color: language === lang ? "white" : "black",
                  cursor: "pointer",
                }}
              >
                {lang === "en" ? "EN" : lang === "zh" ? "中文" : "ES"}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              if (!showForm) {
                setEditingId(null);
                setForm(emptyForm(selectedDateString));
              }
            }}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "none",
              background: "black",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {showForm ? t.hideForm : t.newDelivery}
          </button>
        </div>
      </div>

      {copyMessage ? (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 12,
            background: "#f3f4f6",
            fontSize: 14,
          }}
        >
          {copyMessage}
        </div>
      ) : null}

      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Calendar
          value={selectedDate}
          onChange={(value) => setSelectedDate(value as Date)}
          tileContent={tileContent}
        />

        <div
          style={{
            marginTop: 12,
            fontSize: 15,
            color: "#444",
            fontWeight: 600,
          }}
        >
          {t.totalOrders}: {countsByDate[selectedDateString] || 0}
        </div>
      </div>

      {showForm && (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>{editingId ? t.updateDelivery : t.addDelivery}</h2>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <input
              placeholder={t.customerName}
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder={t.phone}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder={t.address}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder={t.appliance}
              value={form.appliance}
              onChange={(e) => setForm({ ...form, appliance: e.target.value })}
              style={inputStyle}
            />
            <input
              type="date"
              value={form.delivery_date}
              onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder={t.driver}
              value={form.driver}
              onChange={(e) => setForm({ ...form, driver: e.target.value })}
              style={inputStyle}
            />
            <textarea
              placeholder={t.notes}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            />

            <label style={checkRowStyle}>
              <input
                type="checkbox"
                checked={form.install}
                onChange={(e) => setForm({ ...form, install: e.target.checked })}
              />
              {t.install}
            </label>

            <label style={checkRowStyle}>
              <input
                type="checkbox"
                checked={form.paid}
                onChange={(e) => setForm({ ...form, paid: e.target.checked })}
              />
              {t.paid}
            </label>

            <button type="submit" style={primaryButtonStyle}>
              {editingId ? t.updateDelivery : t.saveDelivery}
            </button>
          </form>
        </div>
      )}

      <section>
        {selectedDayDeliveries.length === 0 ? (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 20,
              padding: 18,
            }}
          >
            {t.noDeliveries}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {selectedDayDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                style={{
                  background: delivery.completed ? "#e5e7eb" : "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 20,
                  padding: 16,
                  opacity: delivery.completed ? 0.78 : 1,
                }}
              >
                <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
                  <div>
                    <strong>{t.customerName}:</strong> {delivery.customer_name}
                  </div>
                  <div>
                    <strong>{t.phone}:</strong> {delivery.phone}
                  </div>
                  <div>
                    <strong>{t.address}:</strong> {delivery.address}
                  </div>
                  <div>
                    <strong>{t.appliance}:</strong> {delivery.appliance}
                  </div>
                  <div>
                    <strong>{t.date}:</strong> {delivery.delivery_date}
                  </div>
                  <div>
                    <strong>{t.install}:</strong> {delivery.install ? "Yes" : "No"}
                  </div>
                  <div>
                    <strong>{t.paid}:</strong> {delivery.paid ? "Yes" : "No"}
                  </div>
                  <div>
                    <strong>{t.driver}:</strong> {delivery.driver || "-"}
                  </div>
                  <div>
                    <strong>{t.notes}:</strong> {delivery.notes || "-"}
                  </div>
                  <div>
                    <strong>{t.status}:</strong> {delivery.completed ? t.done : t.open}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <button
                    onClick={() => handleCall(delivery.phone)}
                    style={primaryButtonStyle}
                  >
                    {t.call}
                  </button>

                  <button
                    onClick={() => handleNavigate(delivery.address)}
                    style={primaryButtonStyle}
                  >
                    {t.navigate}
                  </button>

                  <button
                    onClick={() => handleCopyAddress(delivery.address)}
                    style={secondaryButtonStyle}
                  >
                    {t.copyAddress}
                  </button>

                  <button
                    onClick={() => startEdit(delivery)}
                    style={secondaryButtonStyle}
                  >
                    {t.edit}
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: delivery.completed ? "1fr" : "1fr 1fr 1fr",
                    gap: 10,
                  }}
                >
                  {!delivery.completed && (
                    <>
                      <button
                        onClick={() => moveDelivery(delivery.id, "up")}
                        style={secondaryButtonStyle}
                      >
                        {t.moveUp}
                      </button>

                      <button
                        onClick={() => moveDelivery(delivery.id, "down")}
                        style={secondaryButtonStyle}
                      >
                        {t.moveDown}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => toggleCompleted(delivery)}
                    style={{
                      ...secondaryButtonStyle,
                      background: delivery.completed ? "#d1fae5" : "#f3f4f6",
                    }}
                  >
                    {t.completed}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  fontSize: 16,
  outline: "none",
};

const checkRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 16,
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "none",
  background: "black",
  color: "white",
  cursor: "pointer",
  fontSize: 16,
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  background: "white",
  color: "black",
  cursor: "pointer",
  fontSize: 16,
  fontWeight: 600,
};