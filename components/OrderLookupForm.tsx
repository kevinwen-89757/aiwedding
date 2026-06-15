"use client";

import { useRef, useState } from "react";

function nameOnly(value: string) {
  return value.replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, "").replace(/\s{2,}/g, " ").trim();
}

function isValidName(value: string) {
  return /^[\u4e00-\u9fa5a-zA-Z][\u4e00-\u9fa5a-zA-Z\s]*[\u4e00-\u9fa5a-zA-Z]$|^[\u4e00-\u9fa5a-zA-Z]$/.test(value);
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function OrderLookupForm({ defaultName, defaultPhone }: { defaultName: string; defaultPhone: string }) {
  const composingName = useRef(false);
  const [name, setName] = useState(() => nameOnly(defaultName));
  const [phone, setPhone] = useState(() => digitsOnly(defaultPhone));
  const [error, setError] = useState("");

  return (
    <form
      className="form order-lookup-form"
      method="GET"
      action="/orders"
      noValidate
      onSubmit={(event) => {
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();
        if (!trimmedName && trimmedPhone.length !== 11) {
          event.preventDefault();
          setError("请输入姓名或完整的 11 位手机号");
          return;
        }
        if (trimmedName && !isValidName(trimmedName)) {
          event.preventDefault();
          setError("姓名仅支持中文或英文");
          return;
        }
        if (trimmedPhone && trimmedPhone.length !== 11) {
          event.preventDefault();
          setError("手机号需为 11 位");
          return;
        }
        setError("");
      }}
    >
      <div className="form-row order-lookup-row">
        <label>
          <span className="field-label">姓名</span>
          <input
            name="name"
            value={name}
            placeholder="如：张三 或 John Smith"
            autoComplete="name"
            pattern="[\u4e00-\u9fa5a-zA-Z\s]+"
            title="请输入中文或英文姓名"
            aria-invalid={error.includes("姓名")}
            onBeforeInput={(event) => {
              const nativeEvent = event.nativeEvent as InputEvent;
              if (nativeEvent.isComposing || nativeEvent.inputType === "insertCompositionText") return;
              const data = nativeEvent.data;
              if (data && nameOnly(data) !== data) event.preventDefault();
            }}
            onPaste={(event) => {
              event.preventDefault();
              setName((current) => nameOnly(current + event.clipboardData.getData("text")));
              setError("");
            }}
            onCompositionStart={() => {
              composingName.current = true;
            }}
            onCompositionEnd={(event) => {
              composingName.current = false;
              setName(nameOnly(event.currentTarget.value));
              setError("");
            }}
            onChange={(event) => {
              setName(composingName.current ? event.currentTarget.value : nameOnly(event.currentTarget.value));
              setError("");
            }}
          />
        </label>
        <label>
          <span className="field-label">手机号</span>
          <input
            name="phone"
            value={phone}
            placeholder="下单时填写的手机号（选填）"
            maxLength={11}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            pattern="[0-9]{11}"
            title="请输入 11 位手机号"
            aria-invalid={error.includes("手机号")}
            onBeforeInput={(event) => {
              const data = (event.nativeEvent as InputEvent).data;
              if (!data) return;
              if (/\D/.test(data) || phone.length + data.length > 11) event.preventDefault();
            }}
            onPaste={(event) => {
              event.preventDefault();
              setPhone((current) => digitsOnly(current + event.clipboardData.getData("text")));
              setError("");
            }}
            onChange={(event) => {
              setPhone(digitsOnly(event.currentTarget.value));
              setError("");
            }}
          />
        </label>
      </div>
      {error ? <p className="order-lookup-error" role="status">{error}</p> : null}
      <button className="order-lookup-submit" type="submit">验证并查询</button>
    </form>
  );
}
