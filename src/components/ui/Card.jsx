export default function Card({ as: Tag = "section", className = "", children, ...props }) {
  return (
    <Tag className={`ui-card ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}
