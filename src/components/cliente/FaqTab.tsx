"use client";

import { useState } from "react";

const PREGUNTAS: { q: string; a: string }[] = [
  {
    q: "¿Qué incluye el Plan Ilimitado Mensual?",
    a: "Lavados ilimitados por el túnel durante 30 días desde la contratación, con un ingreso máximo por día. No incluye los servicios adicionales (tapiz, alfombra, techo, motor, chasis).",
  },
  {
    q: "¿Cómo renuevo mi plan?",
    a: "Puedes renovarlo en el local, o desde la sección Pagar de nuestra web ingresando tu patente: ahí puedes pagar un período con tarjeta (Webpay Plus) o activar la renovación automática mensual.",
  },
  {
    q: "¿Qué pasa si mi plan vence?",
    a: "Puedes seguir viniendo y pagar un lavado único, o renovar tu plan apenas quieras. Te avisamos cuando esté por vencer.",
  },
  {
    q: "¿Qué medios de pago aceptan?",
    a: "En el local: efectivo, tarjeta y transferencia bancaria. Desde la web: tarjetas de crédito o débito a través de Webpay Plus, o renovación automática con Oneclick.",
  },
  {
    q: "¿Tienen descuento para mi primera visita?",
    a: "Sí. Escríbenos por WhatsApp con la palabra \"descuento\" seguida de tu patente y te enviamos un código de descuento válido por 7 días.",
  },
  {
    q: "¿Puedo comprar lavados para mi empresa?",
    a: "Sí, vendemos lotes de cupones de lavado para empresas, con boleta o factura. Revisa la pestaña \"Venta a Empresa\" para cotizar.",
  },
  {
    q: "¿Necesito reservar hora?",
    a: "Para el lavado túnel no. Para el Lavado Completo Detailing y servicios adicionales te recomendamos agendar con anticipación por WhatsApp para asegurar tu horario.",
  },
];

export default function FaqTab() {
  const [abierta, setAbierta] = useState<number | null>(0);

  return (
    <div className="card">
      {PREGUNTAS.map((p, i) => {
        const open = abierta === i;
        return (
          <div className="faq-item" key={p.q}>
            <button
              type="button"
              className={`faq-question${open ? " open" : ""}`}
              onClick={() => setAbierta(open ? null : i)}
            >
              {p.q}
              <span className="chev">▾</span>
            </button>
            {open && <div className="faq-answer">{p.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
