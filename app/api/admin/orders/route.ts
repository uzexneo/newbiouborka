import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { deleteOrder, getAllOrders, updateOrderStatus } from "@/lib/models";
import { orderStatusSchema } from "@/lib/validation";
import { mockOrders } from "@/lib/mock-data";

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(mockOrders);
  }

  try {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Ошибка получения заявок:", error);
    return NextResponse.json(
      { error: "Ошибка получения заявок" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Параметр id обязателен" },
      { status: 400 }
    );
  }

  const parsed = orderStatusSchema.safeParse(await request.json());
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
    console.error("Ошибка обновления заявки:", error);
    return NextResponse.json(
      { error: "Ошибка обновления заявки" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
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
    console.error("Ошибка удаления заявки:", error);
    return NextResponse.json(
      { error: "Ошибка удаления заявки" },
      { status: 500 }
    );
  }
}
