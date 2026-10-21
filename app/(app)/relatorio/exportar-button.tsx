"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportarButton() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer /> Exportar PDF
    </Button>
  );
}
