import ChoicePicker from "../../design-system/ChoicePicker.jsx";
export function Field({ label, value, onChange, type = "text", options }) {
  return (
    <label>
      {label}
      {options ? (
        <ChoicePicker
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((v) => (
            <option key={v} value={v}>
              {v === "checked"
                ? "Dernière vérification"
                : v === "publication"
                  ? "Dernière publication"
                  : v || "Tous"}
            </option>
          ))}
        </ChoicePicker>
      ) : (
        <input
          step={type === "number" ? "any" : undefined}
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
export function Check({ label, value, onChange }) {
  return (
    <label className="pp-check">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
