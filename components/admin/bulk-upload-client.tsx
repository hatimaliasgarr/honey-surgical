"use client";

import { useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = Record<string, string | number | boolean | null>;
type UploadState = "idle" | "uploading" | "success" | "error";

export function BulkUploadClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<UploadState>("idle");

  async function parseFile(file: File) {
    let parsed: Row[] = [];

    if (file.name.toLowerCase().endsWith(".csv")) {
      const text = await file.text();
      const [headerLine = "", ...lines] = text.split(/\r?\n/).filter(Boolean);
      const headers = headerLine.split(",").map((item) => item.trim());
      parsed = lines.map((line) => {
        const values = line.split(",").map((item) => item.trim());
        return headers.reduce<Row>((row, header, index) => {
          row[header] = values[index] || "";
          return row;
        }, {});
      });
    } else {
      const { readSheet } = await import("read-excel-file/browser");
      const sheetRows = await readSheet(file);
      const headers = (sheetRows[0] || []).map((item: unknown) =>
        String(item || "").trim(),
      );
      parsed = sheetRows.slice(1).map((line: unknown[]) =>
        headers.reduce<Row>((row, header, index) => {
          row[header] = (line[index] as string | number | boolean | null) || "";
          return row;
        }, {}),
      );
    }

    setRows(parsed);
    setState("idle");
    setMessage(`${parsed.length} rows loaded for review.`);
  }

  async function upload() {
    setState("uploading");
    setMessage("");

    try {
      const response = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const skipped =
          Array.isArray(result.skipped) && result.skipped.length
            ? ` ${result.skipped.slice(0, 3).join(" ")}`
            : "";
        throw new Error(`${result.error || "Bulk upload failed."}${skipped}`);
      }

      setState("success");
      setMessage(
        `Imported ${result.count || 0} product${result.count === 1 ? "" : "s"}.${result.skipped?.length ? ` Skipped ${result.skipped.length} row${result.skipped.length === 1 ? "" : "s"}.` : ""}`,
      );
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Bulk upload failed.",
      );
    }
  }

  const columns = rows.length ? Object.keys(rows[0]).slice(0, 8) : [];

  return (
    <div className="grid gap-5 rounded-lg border border-border bg-white p-5 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-medical-deep">
          Bulk Product Upload
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload CSV or Excel files, review rows, then send them to Supabase.
        </p>
      </div>
      <label className="grid cursor-pointer place-items-center rounded-lg border border-dashed border-border bg-secondary p-8 text-center hover:bg-medical-pale">
        <FileSpreadsheet className="size-9 text-primary" aria-hidden="true" />
        <span className="mt-2 font-medium">Choose CSV or Excel file</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              parseFile(file);
            }
          }}
        />
      </label>

      {rows.length ? (
        <>
          {/* Mobile Card List View */}
          <div className="grid gap-4 md:hidden">
            {rows.slice(0, 20).map((row, index) => (
              <div 
                key={index} 
                className="flex flex-col gap-2 rounded-xl border border-border/80 bg-medical-bluePale/5 p-4 shadow-sm text-xs"
              >
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-1">
                  <span className="font-bold text-sm text-medical-deep">Row #{index + 1}</span>
                </div>
                <div className="grid gap-1.5">
                  {columns.map((column) => (
                    <div key={column} className="flex justify-between gap-3">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{column}</span>
                      <span className="font-medium text-foreground text-right truncate max-w-[60%]">
                        {String(row[column] ?? "")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 20).map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column}>
                        {String(row[column] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button
            onClick={upload}
            className="w-fit"
            disabled={state === "uploading"}
          >
            <Upload aria-hidden="true" />
            {state === "uploading" ? "Importing..." : "Import Rows"}
          </Button>
        </>
      ) : null}

      {message ? (
        <p
          className={
            state === "error"
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
