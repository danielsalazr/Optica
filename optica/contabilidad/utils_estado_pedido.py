from __future__ import annotations

import math
from typing import Optional, Sequence, Tuple

from django.db.models import F, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from .models import EstadoPedidoVenta, ItemsVenta

ESTADOS_PEDIDO_DEFINICIONES: Sequence[Tuple[int, str, str]] = (
    (1, "creado", "Pedido tomado"),
    (2, "para_fabricacion", "Para enviar a Fabricar"),
    (3, "en_fabricacion", "Enviado a Fabricar"),
    (4, "listo_entrega", "Listo Para Entrega"),
    (5, "entregado", "Entregado"),
)

ESTADO_PEDIDO_ORDER = {slug: idx for idx, (_, slug, _) in enumerate(ESTADOS_PEDIDO_DEFINICIONES)}
ESTADO_PEDIDO_NOMBRE = {slug: nombre for _, slug, nombre in ESTADOS_PEDIDO_DEFINICIONES}
ESTADO_PEDIDO_ID = {slug: estado_id for estado_id, slug, _ in ESTADOS_PEDIDO_DEFINICIONES}


def ensure_estado_pedido_defaults() -> None:
    for estado_id, _, nombre in ESTADOS_PEDIDO_DEFINICIONES:
        EstadoPedidoVenta.objects.update_or_create(
            id=estado_id,
            defaults={"nombre": nombre},
        )


def get_estado_pedido_by_slug(slug: str) -> EstadoPedidoVenta:
    ensure_estado_pedido_defaults()
    nombre = ESTADO_PEDIDO_NOMBRE[slug]
    estado, _ = EstadoPedidoVenta.objects.update_or_create(
        id=ESTADO_PEDIDO_ID[slug],
        defaults={"nombre": nombre},
    )
    return estado


def identify_estado_pedido_slug(nombre: Optional[str]) -> str:
    value = (nombre or "").lower()
    if "pendiente" in value or "pedido tomado" in value or "creado" in value:
        return "creado"
    if "para enviar" in value or "enviar a fabric" in value:
        return "para_fabricacion"
    if "en fabric" in value or "enviado a fabricar" in value:
        return "en_fabricacion"
    if "listo" in value:
        return "listo_entrega"
    if "garantia" in value or "entregado" in value:
        return "entregado"
    return "creado"


def _save_estado(
    venta,
    slug: str,
    *,
    motivo_sin_anticipo: Optional[str] = None,
    clear_detalle: bool = False,
) -> bool:
    estado = get_estado_pedido_by_slug(slug)
    updated_fields = []

    if venta.estado_pedido_id != estado.id:
        venta.estado_pedido = estado
        updated_fields.append("estado_pedido")

    if motivo_sin_anticipo is not None:
        if motivo_sin_anticipo != venta.motivo_sin_anticipo:
            venta.motivo_sin_anticipo = motivo_sin_anticipo
            updated_fields.append("motivo_sin_anticipo")
    elif clear_detalle and venta.motivo_sin_anticipo:
        venta.motivo_sin_anticipo = None
        updated_fields.append("motivo_sin_anticipo")

    if not updated_fields:
        return False

    venta.estado_pedido_actualizado = timezone.now()
    updated_fields.append("estado_pedido_actualizado")
    venta.save(update_fields=updated_fields)
    return True


def maybe_mark_para_fabricacion(venta) -> bool:
    precio = venta.precio or 0
    total_abono = venta.totalAbono or 0

    if precio <= 0:
        return False

    minimo = math.ceil(precio / 2)
    if total_abono < minimo:
        return False

    actual = identify_estado_pedido_slug(getattr(venta.estado_pedido, "nombre", None))
    if ESTADO_PEDIDO_ORDER.get(actual, 0) >= ESTADO_PEDIDO_ORDER["para_fabricacion"]:
        return False

    return _save_estado(venta, "para_fabricacion", clear_detalle=True)


def mark_estado_pedido(
    venta,
    target_slug: str,
    *,
    motivo_sin_anticipo: Optional[str] = None,
    clear_detalle: bool = False,
) -> bool:
    actual = identify_estado_pedido_slug(getattr(venta.estado_pedido, "nombre", None))
    if ESTADO_PEDIDO_ORDER[target_slug] < ESTADO_PEDIDO_ORDER.get(actual, 0):
        return False
    return _save_estado(
        venta,
        target_slug,
        motivo_sin_anticipo=motivo_sin_anticipo,
        clear_detalle=clear_detalle,
    )


def mark_entregado_si_corresponde(venta) -> bool:
    pendientes = ItemsVenta.objects.filter(
        venta_id=venta.id
    ).annotate(
        despachado=Coalesce(Sum("remisiones_items__cantidad"), 0)
    ).filter(
        despachado__lt=F("cantidad")
    ).exists()

    if pendientes:
        return False

    actual = identify_estado_pedido_slug(getattr(venta.estado_pedido, "nombre", None))
    if ESTADO_PEDIDO_ORDER.get(actual, 0) >= ESTADO_PEDIDO_ORDER["entregado"]:
        return False

    return _save_estado(venta, "entregado", clear_detalle=True)
