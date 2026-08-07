import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components";
import {
  FieldLabel,
  UnitField,
} from "@/modules/inventory/components/inventory-form-fields";

type CreateIngredientFormProps = {
  busy: boolean;
  name: string;
  unit: string;
  minStock: string;
  initialStock: string;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onMinChange: (value: string) => void;
  onInitialChange: (value: string) => void;
  onSubmit: () => void;
};

export function CreateIngredientForm({
  busy,
  name,
  unit,
  minStock,
  initialStock,
  onNameChange,
  onUnitChange,
  onMinChange,
  onInitialChange,
  onSubmit,
}: CreateIngredientFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar al inventario</CardTitle>
        <CardDescription>
          Insumos y mercadería de bodega. Lo que se vende empaquetado (Doritos,
          cerveza) se crea desde Catálogo.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-2">
          <FieldLabel htmlFor="inv-name" hint="Nombre que verás al mover stock.">
            Nombre
          </FieldLabel>
          <Input
            id="inv-name"
            className="h-11"
            placeholder="Ej. Vaso 16 oz, Base mora, Pajita"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        <UnitField unit={unit} onUnitChange={onUnitChange} />
        <div className="space-y-2">
          <FieldLabel
            htmlFor="inv-min"
            hint="Te avisamos cuando el stock baje a este número o menos."
          >
            Avisar cuando queden pocas
          </FieldLabel>
          <Input
            id="inv-min"
            className="h-11"
            type="number"
            min={0}
            value={minStock}
            onChange={(e) => onMinChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel
            htmlFor="inv-initial"
            hint="Cuánto tienes ahora. Déjalo en 0 si aún no llegó mercancía."
          >
            Cantidad inicial
          </FieldLabel>
          <Input
            id="inv-initial"
            className="h-11"
            type="number"
            min={0}
            value={initialStock}
            onChange={(e) => onInitialChange(e.target.value)}
          />
        </div>
        <Button className="h-11" disabled={busy} onClick={onSubmit}>
          Guardar en inventario
        </Button>
      </CardContent>
    </Card>
  );
}
