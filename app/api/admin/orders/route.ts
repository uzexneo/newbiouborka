import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteOrder,
  getAllOrders,
  updateOrderStatus,
} from "@/lib/models";
import { orderStatusSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "private, no-store" };

function unavailable() {
  return NextResponse.json(
    { error: "Заявки недоступны: проверьте подключение базы данных и права доступа к таблице заявок." },
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
    return NextResponse.json(orders, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Ошибка получения заявок:", error instanceof Error ? error.name : "UnknownError");
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

  const parsed = orderStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректный статус", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const order = await updateOrderStatus(id, parsed.data.orderStatus);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof Error && error.name === "ConditionalCheckFailedException") {
      return NextResponse.json({ error: "Заявка не найдена. Обновите список." }, { status: 404 });
    }
    console.error("Ошибка обновления заявки:", error instanceof Error ? error.name : "UnknownError");
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
    console.error("Ошибка удаления заявки:", error instanceof Error ? error.name : "UnknownError");
    return unavailable();
  }
}
