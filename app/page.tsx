"use client";

import { useEffect, useState } from "react";
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
  completed: boolean;
  completed_at: string | null;
};

type Lang = "en" | "zh" | "es";

const translations = {
  en: {
    title: "Appliance Delivery Manager",
    addDelivery: "Add Delivery",
    editDelivery: "Edit Delivery",
    customerName: "Customer Name",
    phone: "Phone",
    address: "Address",
    appliance: "Appliance",
    deliveryDate: "Delivery Date",
    driver: "Driver",
    notes: "Notes",
    install: "Install",
    paid: "Paid",
    saveDelivery: "Save Delivery",
    updateDelivery: "Update Delivery",
    cancelEdit: "Cancel Edit",
    today: "Today",
    all: "All",
    todaysDeliveries: "Today's Deliveries",
    allDeliveries: "All Deliveries",
    noDeliveries: "No deliveries found.",
    customer: "Customer",
    yes: "Yes",
    no: "No",
    status: "Status",
    open: "Open",
    completed: "Completed",
    call: "Call",
    navigate: "Navigate",
    copyAddress: "Copy Address",
    edit: "Edit",
    delete: "Delete",
    markCompleted: "Completed",
    markUncompleted: "Mark Uncompleted",
    addressCopied: "Address copied!",
    failedCopy: "Failed to copy address.",
    noPhone: "No phone number.",
    noAddress: "No address.",
    deleteConfirm: "Delete this delivery?",
  },
  zh: {
    title: "家电送货管理",
    addDelivery: "新增送货",
    editDelivery: "编辑送货",
    customerName: "客户姓名",
    phone: "电话",
    address: "地址",
    appliance: "家电",
    deliveryDate: "送货日期",
    driver: "司机",
    notes: "备注",
    install: "安装",
    paid: "已付款",
    saveDelivery: "保存送货单",
    updateDelivery: "更新送货单",
    cancelEdit: "取消编辑",
    today: "今天",
    all: "全部",
    todaysDeliveries: "今日送货",
    allDeliveries: "全部送货",
    noDeliveries: "没有找到送货记录。",
    customer: "客户",
    yes: "是",
    no: "否",
    status: "状态",
    open: "未完成",
    completed: "已完成",
    call: "打电话",
    navigate: "导航",
    copyAddress: "复制地址",
    edit: "编辑",
    delete: "删除",
    markCompleted: "完成",
    markUncompleted: "取消完成",
    addressCopied: "地址已复制！",
    failedCopy: "复制地址失败。",
    noPhone: "没有电话号码。",
    noAddress: "没有地址。",
    deleteConfirm: "要删除这条送货记录吗？",
  },
  es: {
    title: "Administrador de Entregas",
    addDelivery: "Agregar Entrega",
    editDelivery: "Editar Entrega",
    customerName: "Nombre del Cliente",
    phone: "Teléfono",
    address: "Dirección",
    appliance: "Electrodoméstico",
    deliveryDate: "Fecha de Entrega",
    driver: "Chofer",
    notes: "Notas",
    install: "Instalación",
    paid: "Pagado",
    saveDelivery: "Guardar Entrega",
    updateDelivery: "Actualizar Entrega",
    cancelEdit: "Cancelar Edición",
    today: "Hoy",
    all: "Todo",
    todaysDeliveries: "Entregas de Hoy",
    allDeliveries: "Todas las Entregas",
    noDeliveries: "No se encontraron entregas.",
    customer: "Cliente",
    yes: "Sí",
    no: "No",
    status: "Estado",
    open: "Abierta",
    completed: "Completada",
    call: "Llamar",
    navigate: "Navegar",
    copyAddress: "Copiar Dirección",
    edit: "Editar",
    delete: "Eliminar",
    markCompleted: "Completar",
    markUncompleted: "Marcar Pendiente",
    addressCopied: "¡Dirección copiada!",
    failedCopy: "No se pudo copiar la dirección.",
    noPhone: "No hay número de teléfono.",
    noAddress: "No hay dirección.",
    deleteConfirm: "¿Eliminar esta entrega?",
  },
};

export default function Home() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"today" | "all">("today");
  const [lang, setLang] = useState<Lang>("en");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [appliance, setAppliance] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [install, setInstall] = useState(false);
  const [paid, setPaid] = useState(false);
  const [driver, setDriver] = useState("");
  const [notes, setNotes] = useState("");

  const t = translations[lang];

  async function loadDeliveries() {
    setLoading(true);

    const { data, error } = await supabase
      .from("deliveries")
      .select("*")
      .order("delivery_date", { ascending: true })
      .order("completed", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      setDeliveries((data || []) as Delivery[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDeliveries();
  }, []);

  function resetForm() {
    setEditingId(null);
    setCustomerName("");
    setPhone("");
    setAddress("");
    setAppliance("");
    setDeliveryDate("");
    setInstall(false);
    setPaid(false);
    setDriver("");
    setNotes("");
  }

  async function handleSaveDelivery(e: React.FormEvent) {
    e.preventDefault();

    if (editingId === null) {
      const { error } = await supabase.from("deliveries").insert([
        {
          customer_name: customerName,
          phone,
          address,
          appliance,
          delivery_date: deliveryDate,
          install,
          paid,
          driver,
          notes,
          completed: false,
          completed_at: null,
        },
      ]);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("deliveries")
        .update({
          customer_name: customerName,
          phone,
          address,
          appliance,
          delivery_date: deliveryDate,
          install,
          paid,
          driver,
          notes,
        })
        .eq("id", editingId);

      if (error) {
        alert(error.message);
        return;
      }
    }

    resetForm();
    loadDeliveries();
  }

  async function handleDeleteDelivery(id: number) {
    const ok = window.confirm(t.deleteConfirm);
    if (!ok) return;

    const { error } = await supabase.from("deliveries").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDeliveries();
  }

  async function handleCompleteDelivery(id: number, completed: boolean) {
    const { error } = await supabase
      .from("deliveries")
      .update({
        completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDeliveries();
  }

  function handleEditDelivery(item: Delivery) {
    setEditingId(item.id);
    setCustomerName(item.customer_name || "");
    setPhone(item.phone || "");
    setAddress(item.address || "");
    setAppliance(item.appliance || "");
    setDeliveryDate(item.delivery_date || "");
    setInstall(!!item.install);
    setPaid(!!item.paid);
    setDriver(item.driver || "");
    setNotes(item.notes || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCopyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      alert(t.addressCopied);
    } catch {
      alert(t.failedCopy);
    }
  }

  function handleCall(phoneNumber: string) {
    if (!phoneNumber) {
      alert(t.noPhone);
      return;
    }

    const cleanedPhone = phoneNumber.replace(/[^\d+]/g, "");
    window.location.href = `tel:${cleanedPhone}`;
  }

  function handleNavigate(address: string) {
    if (!address) {
      alert(t.noAddress);
      return;
    }

    const encoded = encodeURIComponent(address);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      "_blank"
    );
  }

  function formatDateToLocal(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const todayString = formatDateToLocal(new Date());

  const visibleDeliveries =
    viewMode === "today"
      ? deliveries.filter((item) => item.delivery_date === todayString)
      : deliveries;

  const sortedVisibleDeliveries = [...visibleDeliveries].sort((a, b) => {
    if (a.delivery_date !== b.delivery_date) {
      return a.delivery_date.localeCompare(b.delivery_date);
    }

    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    return a.id - b.id;
  });

  const pageStyle: React.CSSProperties = {
    padding: "16px",
    fontFamily: "Arial, sans-serif",
    maxWidth: "720px",
    margin: "0 auto",
    backgroundColor: "#f8f8f8",
    minHeight: "100vh",
  };

  const cardBoxStyle: React.CSSProperties = {
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "16px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  };

  const inputStyle: React.CSSProperties = {
    padding: "14px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    width: "100%",
    boxSizing: "border-box",
  };

  const primaryButton: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    backgroundColor: "#111",
    color: "white",
    cursor: "pointer",
    minHeight: "48px",
  };

  const secondaryButton: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    backgroundColor: "white",
    color: "#111",
    cursor: "pointer",
    minHeight: "48px",
  };

  const langButton = (active: boolean): React.CSSProperties => ({
    ...secondaryButton,
    flex: 1,
    backgroundColor: active ? "#111" : "white",
    color: active ? "white" : "#111",
    padding: "10px 12px",
    minHeight: "42px",
  });

  return (
    <div style={pageStyle}>
      <h1 style={{ fontSize: "28px", marginBottom: "12px" }}>{t.title}</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: "16px" }}>
        <button onClick={() => setLang("en")} style={langButton(lang === "en")}>
          English
        </button>
        <button onClick={() => setLang("zh")} style={langButton(lang === "zh")}>
          中文
        </button>
        <button onClick={() => setLang("es")} style={langButton(lang === "es")}>
          Español
        </button>
      </div>

      <div style={cardBoxStyle}>
        <h2 style={{ marginTop: 0 }}>
          {editingId === null ? t.addDelivery : t.editDelivery}
        </h2>

        <form onSubmit={handleSaveDelivery} style={{ display: "grid", gap: 12 }}>
          <input
            placeholder={t.customerName}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            placeholder={t.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            placeholder={t.address}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            placeholder={t.appliance}
            value={appliance}
            onChange={(e) => setAppliance(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            placeholder={t.driver}
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            style={inputStyle}
          />

          <textarea
            placeholder={t.notes}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              ...inputStyle,
              minHeight: "90px",
              resize: "vertical",
            }}
          />

          <label style={{ fontSize: "16px" }}>
            <input
              type="checkbox"
              checked={install}
              onChange={(e) => setInstall(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            {t.install}
          </label>

          <label style={{ fontSize: "16px" }}>
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            {t.paid}
          </label>

          <div style={{ display: "grid", gap: 10 }}>
            <button type="submit" style={primaryButton}>
              {editingId === null ? t.saveDelivery : t.updateDelivery}
            </button>

            {editingId !== null && (
              <button type="button" onClick={resetForm} style={secondaryButton}>
                {t.cancelEdit}
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setViewMode("today")}
          style={{
            ...secondaryButton,
            flex: 1,
            backgroundColor: viewMode === "today" ? "#ddd" : "white",
          }}
        >
          {t.today}
        </button>

        <button
          onClick={() => setViewMode("all")}
          style={{
            ...secondaryButton,
            flex: 1,
            backgroundColor: viewMode === "all" ? "#ddd" : "white",
          }}
        >
          {t.all}
        </button>
      </div>

      <h2 style={{ fontSize: "22px" }}>
        {viewMode === "today" ? t.todaysDeliveries : t.allDeliveries}
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : sortedVisibleDeliveries.length === 0 ? (
        <div style={cardBoxStyle}>
          <p style={{ margin: 0 }}>{t.noDeliveries}</p>
        </div>
      ) : (
        sortedVisibleDeliveries.map((item) => {
          const isCompleted = !!item.completed;

          const itemCardStyle: React.CSSProperties = {
            backgroundColor: isCompleted ? "#e5e5e5" : "white",
            border: "1px solid #ddd",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            opacity: isCompleted ? 0.75 : 1,
          };

          return (
            <div key={item.id} style={itemCardStyle}>
              <p>
                <strong>{t.customer}:</strong> {item.customer_name}
              </p>
              <p>
                <strong>{t.phone}:</strong> {item.phone}
              </p>
              <p>
                <strong>{t.address}:</strong> {item.address}
              </p>
              <p>
                <strong>{t.appliance}:</strong> {item.appliance}
              </p>
              <p>
                <strong>{t.deliveryDate}:</strong> {item.delivery_date}
              </p>
              <p>
                <strong>{t.install}:</strong> {item.install ? t.yes : t.no}
              </p>
              <p>
                <strong>{t.paid}:</strong> {item.paid ? t.yes : t.no}
              </p>
              <p>
                <strong>{t.driver}:</strong> {item.driver}
              </p>
              <p>
                <strong>{t.notes}:</strong> {item.notes}
              </p>
              <p>
                <strong>{t.status}:</strong> {isCompleted ? t.completed : t.open}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <button onClick={() => handleCall(item.phone)} style={primaryButton}>
                  {t.call}
                </button>

                <button
                  onClick={() => handleNavigate(item.address)}
                  style={primaryButton}
                >
                  {t.navigate}
                </button>

                <button
                  onClick={() => handleCopyAddress(item.address)}
                  style={secondaryButton}
                >
                  {t.copyAddress}
                </button>

                <button
                  onClick={() => handleEditDelivery(item)}
                  style={secondaryButton}
                >
                  {t.edit}
                </button>

                <button
                  onClick={() => handleDeleteDelivery(item.id)}
                  style={secondaryButton}
                >
                  {t.delete}
                </button>

                <button
                  onClick={() => handleCompleteDelivery(item.id, isCompleted)}
                  style={isCompleted ? secondaryButton : primaryButton}
                >
                  {isCompleted ? t.markUncompleted : t.markCompleted}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}