function InputField({
  icon,
  type = "text",
  name,
  placeholder,
  onChange,
  value,
  defaultValue,
  required = true,
  ...rest
}) {
  return (
    <div style={inputGroupStyle}>
      {icon && <span style={iconStyle}>{icon}</span>}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        defaultValue={defaultValue}
        style={inputStyle}
        required={required}
        {...rest}
      />
    </div>
  );
}

const inputGroupStyle = {
  display: "flex",
  alignItems: "center",
  background: "#f9fafb",
  border: "1.5px solid #e5e7eb",
  borderRadius: "12px",
  padding: "0 16px",
};

const iconStyle = {
  marginRight: "10px",
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
};

const inputStyle = {
  flex: 1,
  border: "none",
  background: "transparent",
  padding: "14px 0",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
  fontFamily: "'Poppins', sans-serif",
  minWidth: 0,
};

export default InputField;
