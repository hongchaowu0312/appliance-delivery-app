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
  driver: string; // 继续复用这个字段，前端显示为“送货时间段”
  notes: string;
  completed?: boolean;
};

type Language = "English" | "中文" | "Español";

const textMap = {
  English: {
    title: "Delivery Manager",
    addNew: "Add New Order",
    customerName: "Customer Name",
    phone: "Phone",
    address: "Address",
    appliance: "Appliance",
    deliveryDate: "Delivery Date",
    deliveryTime: "Delivery Time",
    install: "Need Install",
    paid: "Paid",
    notes: "Notes",
    save: "Save",
    update: "Update",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    markDone: "Mark Done",
    undoDone: "Undo",
    todayOrders: "Today's Orders",
    upcomingOrders: "Upcoming Orders",
    allOrders: "All Orders",
    showAllOrders: "View All Orders",
    hideAllOrders: "Hide All Orders",
    noOrders: "No orders",
    yes: "Yes",
    no: "No",
    confirmDelete: "Are you sure you want to delete this order?",
    language: "Language",
  },
  中文: {
    title: "送货管理",
    addNew: "新增订单",
    customerName: "客户姓名",
    phone: "电话",
    address: "地址",
    appliance: "产品",
    deliveryDate: "送货日期",
    deliveryTime: "送货时间段",
    install: "需要安装",
    paid: "已付款",
    notes: "备注",
    save: "保存",
    update: "更新",
    cancel: "取消",
    edit: "编辑",
    delete: "删除",
    markDone: "完成",
    undoDone: "取消完成",
    todayOrders: "今天订单",
    upcomingOrders: "待送订单",
    allOrders: "所有订单",
    showAllOrders: "查看所有订单",
    hideAllOrders: "隐藏所有订单",
    noOrders: "没有订单",
    yes: "是",
    no: "否",
    confirmDelete: "确定要删除这个订单吗？",
    language: "语言",
  },
  Español: {
    title: "Gestor de Entregas",
    addNew: "Agregar Pedido",
    customerName: "Nombre del Cliente",
    phone: "Teléfono",
    address: "Dirección",
    appliance: "Electrodoméstico",
    deliveryDate: "Fecha de Entrega",
    deliveryTime: "Horario de Entrega",
    install: "Necesita Instalación",
    paid: "Pagado",
    notes: "Notas",
    save: "Guardar",
    update: "Actualizar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    markDone: "Completado",
    undoDone: "Deshacer",
    todayOrders: "Pedidos de Hoy",
    upcomingOrders: "Pedidos Próximos",
    allOrders: "Todos los Pedidos",
    showAllOrders: "Ver Todos los Pedidos",
    hideAllOrders: "Ocultar Todos los Pedidos",
    noOrders: "No hay pedidos",
    yes: "Sí",
    no: "No",
    confirmDelete: "¿Seguro que quieres eliminar este pedido?",
    language: "Idioma",
  },
};

function getCalendarLocale(language: Language) {
  if (language === "中文") return "zh-CN";
  if (language === "Español") return "es-ES";
  return "en-US";
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("中文");
  const t = textMap[language];

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    appliance: "",
    delivery_date: formatDate(new Date()),
    install: false,
    paid: false,
    driver: "",
    notes: "",
    completed: false,
  });

  async function fetchDeliveries() {
    const { data, error } = await supabase
      .from("deliveries")
      .select("*")
      .order("delivery_date", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    const normalized = (data || []).map((item: any) => ({
      ...item,
      install: item.install === true,
      paid: item.paid === true,
      completed: item.completed === true,
      driver: item.driver || "",
      notes: item.notes || "",
    }));

    setDeliveries(normalized);
  }

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const selectedDateStr = formatDate(selectedDate);
  const todayStr = formatDate(new Date());

  const selectedDayOrders = useMemo(() => {
    return deliveries.filter(
      (d) => d.delivery_date === selectedDateStr && d.completed !== true
    );
  }, [deliveries, selectedDateStr]);

  const upcomingOrders = useMemo(() => {
    return deliveries.filter(
      (d) => d.delivery_date > todayStr && d.completed !== true
    );
  }, [deliveries, todayStr]);

  const allOrders = useMemo(() => {
    return [...deliveries].sort((a, b) => {
      if (a.delivery_date < b.delivery_date) return 1;
      if (a.delivery_date > b.delivery_date) return -1;
      return b.id - a.id;
    });
  }, [deliveries]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      appliance: form.appliance.trim(),
      delivery_date: form.delivery_date,
      install: form.install === true,
      paid: form.paid === true,
      driver: form.driver.trim(), // 这里保存“送货时间段”
      notes: form.notes.trim(),
      completed: form.completed === true,
    };

    if (editingId) {
      const { error } = await supabase
        .from("deliveries")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error("Update error:", error);
        return;
      }
    } else {
      const { error } = await supabase.from("deliveries").insert([payload]);

      if (error) {
        console.error("Insert error:", error);
        return;
      }
    }

    resetForm();
    fetchDeliveries();
  }

  function resetForm() {
    setForm({
      customer_name: "",
      phone: "",
      address: "",
      appliance: "",
      delivery_date: formatDate(new Date()),
      install: false,
      paid: false,
      driver: "",
      notes: "",
      completed: false,
    });
    setEditingId(null);
  }

  function handleEdit(order: Delivery) {
    setEditingId(order.id);
    setForm({
      customer_name: order.customer_name || "",
      phone: order.phone || "",
      address: order.address || "",
      appliance: order.appliance || "",
      delivery_date: order.delivery_date || formatDate(new Date()),
      install: order.install === true,
      paid: order.paid === true,
      driver: order.driver || "",
      notes: order.notes || "",
      completed: order.completed === true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: number) {
    const ok = window.confirm(t.confirmDelete);
    if (!ok) return;

    const { error } = await supabase.from("deliveries").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    fetchDeliveries();
  }

  async function toggleCompleted(order: Delivery) {
    const { error } = await supabase
      .from("deliveries")
      .update({ completed: !(order.completed === true) })
      .eq("id", order.id);

    if (error) {
      console.error("Complete toggle error:", error);
      return;
    }

    fetchDeliveries();
  }

  function OrderCard(order: Delivery, showDelete = false) {
    return (
      <div
        key={order.id}
        className={`rounded-2xl p-4 shadow border mb-3 ${
          order.completed ? "bg-gray-100 text-gray-500" : "bg-white"
        }`}
      >
        <div className="font-bold text-lg">{order.customer_name}</div>
        <div>{order.phone}</div>
        <div>{order.address}</div>
        <div>{order.appliance}</div>
        <div>
          {t.deliveryDate}: {order.delivery_date}
        </div>
        <div>
          {t.deliveryTime}: {order.driver || "-"}
        </div>
        <div>
          {t.install}: {order.install ? t.yes : t.no}
        </div>
        <div>
          {t.paid}: {order.paid ? t.yes : t.no}
        </div>
        {order.notes ? <div>{t.notes}: {order.notes}</div> : null}

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => handleEdit(order)}
            className="px-3 py-2 rounded-xl bg-blue-600 text-white"
          >
            {t.edit}
          </button>

          <button
            onClick={() => toggleCompleted(order)}
            className="px-3 py-2 rounded-xl bg-green-600 text-white"
          >
            {order.completed ? t.undoDone : t.markDone}
          </button>

          {showDelete && (
            <button
              onClick={() => handleDelete(order.id)}
              className="px-3 py-2 rounded-xl bg-red-600 text-white"
            >
              {t.delete}
            </button>
          )}
        </div>
      </div>
    );
  }

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const count = deliveries.filter(
      (d) => d.delivery_date === formatDate(date) && d.completed !== true
    ).length;

    if (count === 0) return null;

    return (
      <div className="text-[10px] mt-1 font-semibold text-blue-600">
        {count}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">{t.title}</h1>

        <div className="flex items-center gap-2">
          <span>{t.language}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="border rounded-xl px-3 py-2"
          >
            <option value="中文">中文</option>
            <option value="English">English</option>
            <option value="Español">Español</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? t.update : t.addNew}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border rounded-xl px-3 py-2"
            placeholder={t.customerName}
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            required
          />

          <input
            className="border rounded-xl px-3 py-2"
            placeholder={t.phone}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <input
            className="border rounded-xl px-3 py-2 md:col-span-2"
            placeholder={t.address}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <input
            className="border rounded-xl px-3 py-2"
            placeholder={t.appliance}
            value={form.appliance}
            onChange={(e) => setForm({ ...form, appliance: e.target.value })}
          />

          <input
            type="date"
            className="border rounded-xl px-3 py-2"
            value={form.delivery_date}
            onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
          />

          <input
            className="border rounded-xl px-3 py-2"
            placeholder={t.deliveryTime}
            value={form.driver}
            onChange={(e) => setForm({ ...form, driver: e.target.value })}
          />

          <input
            className="border rounded-xl px-3 py-2 md:col-span-2"
            placeholder={t.notes}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.install}
              onChange={(e) => setForm({ ...form, install: e.target.checked })}
            />
            {t.install}
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.paid}
              onChange={(e) => setForm({ ...form, paid: e.target.checked })}
            />
            {t.paid}
          </label>

          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-black text-white"
            >
              {editingId ? t.update : t.save}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl bg-gray-300"
              >
                {t.cancel}
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <Calendar
          locale={getCalendarLocale(language)}
          value={selectedDate}
          onChange={(value) => setSelectedDate(value as Date)}
          tileContent={tileContent}
        />

        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-3">
            {selectedDateStr === todayStr ? t.todayOrders : `${selectedDateStr} Orders`}
          </h2>

          {selectedDayOrders.length === 0 ? (
            <div className="text-gray-500">{t.noOrders}</div>
          ) : (
            selectedDayOrders.map((order) => OrderCard(order, false))
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">{t.upcomingOrders}</h2>

          <button
            onClick={() => setShowAllOrders(!showAllOrders)}
            className="px-3 py-2 rounded-xl bg-gray-800 text-white"
          >
            {showAllOrders ? t.hideAllOrders : t.showAllOrders}
          </button>
        </div>

        {upcomingOrders.length === 0 ? (
          <div className="text-gray-500">{t.noOrders}</div>
        ) : (
          upcomingOrders.map((order) => OrderCard(order, false))
        )}
      </div>

      {showAllOrders && (
        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">{t.allOrders}</h2>

          {allOrders.length === 0 ? (
            <div className="text-gray-500">{t.noOrders}</div>
          ) : (
            allOrders.map((order) => OrderCard(order, true))
          )}
        </div>
      )}
    </main>
  );
}