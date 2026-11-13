"use client";

import { useEffect, useState } from "react";
import { startPixels, trackPurchase } from "@/lib/pixel-events";
import { useStore } from "@/lib/use-store";
import "./thankyou.css";

/** Numéro WhatsApp de la boutique, au format international (212…, sans + ni 0 au début) */
const WHATSAPP = "212703740818";
const MESSAGE = "مرحبا \nلقد قمت بالطلب عبر الموقع الالكتروني و اريد تاكيد طلبي";

/** Page de remerciement après une commande (/merci/?ref=LO-…) */
export function ThankYou() {
  const [ref, setRef] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("ref") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- paramètre lu dans l'adresse, après l'affichage
    setRef(/^LO-[A-Z0-9]+$/.test(value) ? value : "");
  }, []);

  // Pixels : visite de la page merci et achat (une fois par commande)
  const store = useStore();
  useEffect(() => {
    if (!store) return;
    startPixels(store.pixels);
    if (ref) trackPurchase(ref);
  }, [store, ref]);

  const text = ref ? `${MESSAGE}\nرقم الطلب: ${ref}` : MESSAGE;
  const whatsapp = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

  return (
    <div className="ty" dir="rtl" lang="ar">
      <div className="ty-rings" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="ty-card">
        <div className="ty-scene" aria-hidden>
          <div className="ty-badge">
            <div className="ty-badge-back" />
            <div className="ty-badge-ring" />
            <div className="ty-badge-face">
              <svg className="ty-check" viewBox="0 0 24 24">
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
            </div>
            <span className="ty-spark" />
            <span className="ty-spark" />
            <span className="ty-spark" />
            <span className="ty-spark" />
            <span className="ty-spark" />
          </div>
        </div>

        <span className="ty-eyebrow">تم تأكيد الطلب</span>
        <h1>شكراً على طلبك!</h1>
        <p className="ty-lead">لقد استلمنا طلبك بنجاح. سيتواصل معك فريقنا قريباً جداً لتأكيد تفاصيل التوصيل.</p>
        {ref && (
          <p className="ty-ref">
            رقم الطلب: <b dir="ltr">{ref}</b>
          </p>
        )}
        <p className="ty-note">لديك سؤال أو استفسار؟ راسلنا مباشرة عبر واتساب، ونرد عليك بسرعة.</p>

        <div className="ty-actions">
          <a className="ty-btn ty-btn-wa" href={whatsapp} target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden>
              <path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.26-.1-.45-.15-.65.15-.2.3-.75.95-.9 1.15-.17.2-.34.22-.63.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.5.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.57-.48-.5-.65-.5h-.56c-.2 0-.5.07-.77.37-.26.3-1 1-1 2.42 0 1.43 1.03 2.8 1.17 3 .15.2 2.03 3.1 4.9 4.35.68.3 1.22.47 1.64.6.69.22 1.31.19 1.8.11.55-.08 1.7-.7 1.93-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.55-.34zM12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2z" />
            </svg>
            تاكيد الطلب عبر الواتساب
          </a>
        </div>
      </div>
    </div>
  );
}
