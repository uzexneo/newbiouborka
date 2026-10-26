import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteOrder,
  getAllOrders,
  getVisitById,
  updateOrderLeadQuality,
  updateOrderStatus,
} from "@/lib/models";
import { orderStatusSchema } from "@/lib/validation";
import { matchLeadVisit, type LeadVisitMatch } from "@/lib/lead-reporting";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "private, no-store" };
const orderUpdateSchema = z.union([
  orderStatusSchema.strict(),
  z
    .object({ leadQuality: z.enum(["unreviewed", "real", "test", "spam"]) })
    .strict(),
]);

function unavailable() {
  return NextResponse.json(
    {
      error:
        "Заявки недоступны: проверьте подключение базы данных и права доступа к таблице заявок.",
    },
    { status: 503, headers: noStoreHeaders }
  );
}

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return unavailable();
  }

  try {
    const orders = await getAllOrders();
    const visitIds = [
      ...new Set(
        orders.flatMap((order) =>
          order.attribution?.visitId ? [order.attribution.visitId] : []
        )
      ),
    ];
    const matches = new Map<
      string,
      Awaited<ReturnType<typeof getVisitById>> | "unavailable"
    >();
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(4, visitIds.length) }, async () => {
        while (cursor < visitIds.length) {
          const id = visitIds[cursor++];
          try {
            matches.set(id, await getVisitById(id));
          } catch {
            // Visit tracking must not hide a real customer application.
            matches.set(id, "unavailable");
          }
        }
      })
    );
    return NextResponse.json(
      orders.map((order) => {
        const visit = order.attribution?.visitId
          ? matches.get(order.attribution.visitId)
          : undefined;
        const visitMatch: LeadVisitMatch =
          visit === "unavailable"
            ? { status: "unavailable" }
            : matchLeadVisit(order, visit);
        return { ...order, visitMatch };
      }),
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error(
      "Ошибка получения заявок:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return unavailable();
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return unavailable();
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Параметр id обязателен" },
      { status: 400 }
    );
  }

  const parsed = orderUpdateSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Некорректный статус или качество заявки",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const order =
      "leadQuality" in parsed.data
        ? await updateOrderLeadQuality(id, parsed.data.leadQuality)
        : await updateOrderStatus(id, parsed.data.orderStatus);
    return NextResponse.json(order, { headers: noStoreHeaders });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    ) {
      return NextResponse.json(
        { error: "Заявка не найдена. Обновите список." },
        { status: 404 }
      );
    }
    console.error(
      "Ошибка обновления заявки:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return unavailable();
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return unavailable();
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Параметр id обязателен" },
      { status: 400 }
    );
  }

  try {
    await deleteOrder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Ошибка удаления заявки:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return unavailable();
  }
}
