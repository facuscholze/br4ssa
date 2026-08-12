"use client";

import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SITE } from "@/lib/data";
import { DURATION, EASE } from "@/lib/motion";
import {
  PARTY_SIZES,
  reservationSchema,
  type ReservationInput,
} from "@/lib/reservation-schema";

/** Service hours are 12:00–00:00; `max` cannot express midnight, so the last
 *  bookable slot is the half hour before it. */
const FIRST_SLOT = "12:00";
const LAST_SLOT = "23:30";

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

// Mirrors reservationSchema's MAX_RESERVATION_YEAR — keeps the calendar
// picker's upper bound in sync with what the schema will actually accept.
function maxDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  const local = new Date(now.getTime() - offset);
  local.setUTCFullYear(local.getUTCFullYear() + 2);
  return local.toISOString().slice(0, 10);
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  // No role="alert" here: on submit every invalid field would fire at once
  // and screen readers step on each other. The single summary above the
  // form announces the batch; this text is still reachable via
  // aria-describedby when the user tabs into the field itself.
  return (
    <span id={id} className="text-xs text-destructive">
      {message}
    </span>
  );
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {" "}
      *
    </span>
  );
}

export function ReservationForm() {
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      nombre: "",
      telefono: "",
      personas: "",
      fecha: "",
      hora: "",
      comentarios: "",
    },
  });

  const onSubmit = (data: ReservationInput) => {
    const lines = [
      "Hola! Quiero reservar una mesa en Brasa 🔥",
      `Nombre: ${data.nombre}`,
      `Teléfono: ${data.telefono}`,
      `Personas: ${data.personas}`,
      `Fecha: ${data.fecha}`,
      `Hora: ${data.hora}`,
    ];
    if (data.comentarios) lines.push(`Comentarios: ${data.comentarios}`);

    const message = encodeURIComponent(lines.join("\n"));
    const url = `https://wa.me/${SITE.whatsapp}?text=${message}`;

    setWhatsappUrl(url);
    setErrorCount(0);
    toast.success("¡Reserva lista para enviar!", {
      description: "Te abrimos WhatsApp con los datos ya cargados.",
    });
    window.open(url, "_blank", "noopener");
    reset();
  };

  const onInvalid = (fieldErrors: typeof errors) => {
    setErrorCount(Object.keys(fieldErrors).length);
  };

  // The visitor's clock is not the server's, so `min` is applied to the mounted
  // node rather than rendered into the server HTML.
  const { ref: registerFecha, ...fechaField } = register("fecha");
  const fechaRef = useCallback(
    (node: HTMLInputElement | null) => {
      registerFecha(node);
      if (node) {
        node.min = today();
        node.max = maxDate();
      }
    },
    [registerFecha]
  );

  return (
    <div aria-live="polite">
      <AnimatePresence mode="wait">
        {whatsappUrl ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE }}
            className="flex flex-col items-center py-14 text-center"
          >
            <CheckCircle2 className="mb-4 size-12 text-ember" />
            <h4 className="mb-2.5 text-[22px] text-ember">¡Todo listo!</h4>
            <p className="max-w-[36ch] text-muted-foreground">
              Te abrimos WhatsApp con tu reserva cargada — solo tenés que
              enviar el mensaje.
            </p>
            <Button
              size="lg"
              className="mt-7 rounded-full px-7"
              nativeButton={false}
              render={
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" />
              }
            >
              <MessageCircle className="size-4" />
              Abrir WhatsApp
            </Button>
            <p className="mt-3 max-w-[34ch] text-xs text-muted-foreground">
              ¿No se abrió sola? Usá el botón de arriba.
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-full"
              onClick={() => setWhatsappUrl(null)}
            >
              Hacer otra reserva
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE }}
            noValidate
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="flex flex-col gap-5"
          >
            {errorCount > 0 && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
              >
                {errorCount === 1
                  ? "Hay 1 campo que necesita tu atención."
                  : `Hay ${errorCount} campos que necesitan tu atención.`}
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="f-nombre"
                  className="font-mono text-xs text-muted-foreground"
                >
                  Nombre y apellido
                  <RequiredMark />
                </Label>
                <Input
                  id="f-nombre"
                  autoComplete="name"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.nombre}
                  aria-describedby={errors.nombre ? "f-nombre-error" : undefined}
                  {...register("nombre")}
                />
                <FieldError
                  id="f-nombre-error"
                  message={errors.nombre?.message}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="f-telefono"
                  className="font-mono text-xs text-muted-foreground"
                >
                  Teléfono
                  <RequiredMark />
                </Label>
                <Input
                  id="f-telefono"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+54 9 11 1234-5678"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.telefono}
                  aria-describedby={
                    errors.telefono ? "f-telefono-error" : undefined
                  }
                  {...register("telefono")}
                />
                <FieldError
                  id="f-telefono-error"
                  message={errors.telefono?.message}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="f-personas"
                  className="font-mono text-xs text-muted-foreground"
                >
                  Personas
                  <RequiredMark />
                </Label>
                <Controller
                  control={control}
                  name="personas"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="f-personas"
                        className="h-11 w-full"
                        aria-required="true"
                        aria-invalid={!!errors.personas}
                        aria-describedby={
                          errors.personas ? "f-personas-error" : undefined
                        }
                      >
                        <SelectValue placeholder="Elegí una cantidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {PARTY_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError
                  id="f-personas-error"
                  message={errors.personas?.message}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="f-fecha"
                  className="font-mono text-xs text-muted-foreground"
                >
                  Fecha
                  <RequiredMark />
                </Label>
                <Input
                  id="f-fecha"
                  type="date"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.fecha}
                  aria-describedby={errors.fecha ? "f-fecha-error" : undefined}
                  ref={fechaRef}
                  {...fechaField}
                />
                <FieldError id="f-fecha-error" message={errors.fecha?.message} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="f-hora"
                  className="font-mono text-xs text-muted-foreground"
                >
                  Hora
                  <RequiredMark />
                </Label>
                <Input
                  id="f-hora"
                  type="time"
                  min={FIRST_SLOT}
                  max={LAST_SLOT}
                  step={1800}
                  required
                  aria-required="true"
                  aria-invalid={!!errors.hora}
                  aria-describedby={
                    errors.hora ? "f-hora-error" : "f-hora-hint"
                  }
                  {...register("hora")}
                />
                {errors.hora ? (
                  <FieldError id="f-hora-error" message={errors.hora.message} />
                ) : (
                  <span id="f-hora-hint" className="text-xs text-muted-foreground">
                    Servimos de 12:00 a 00:00
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="f-comentarios"
                  className="font-mono text-xs text-muted-foreground"
                >
                  Comentarios (opcional)
                </Label>
                <Textarea
                  id="f-comentarios"
                  placeholder="Alergias, ocasión especial, etc."
                  className="min-h-11"
                  {...register("comentarios")}
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="mt-2 w-full justify-center rounded-full text-base"
            >
              Confirmar por WhatsApp
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Al confirmar te llevamos a WhatsApp con los datos ya cargados.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
