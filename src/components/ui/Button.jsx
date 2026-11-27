// variant: "primary" (52px) | "secondary" (48px) | "ghost" (44px). tom: "perigo" para ações destrutivas.
export default function Button({ variant = "primary", tom, bloco = false, icone, className = "", type = "button", children, ...props }) {
  const classes = ["btn", `btn-${variant}`, tom && `btn-${tom}`, bloco && "btn-bloco", className].filter(Boolean).join(" ");
  return (
    <button type={type} className={classes} {...props}>
      {icone}
      {children}
    </button>
  );
}
