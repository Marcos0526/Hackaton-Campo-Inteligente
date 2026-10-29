"""
Transporter search module for the Hackaton-Campo-Inteligente project.

Given an origin, destination, and amount of material, this module searches
for transporter directories and returns options with name, contact, estimated
price, and a fairness assessment.
"""


# Baseline price per kg by transport mode (approximate market rates as of 2026)
_BASELINE_PRICES = {
    "truck": 1.80,  # USD per kg
    "rail": 0.90,
    "ship": 0.45,
    "air": 3.50,
}


def assess_fairness(
    estimated_price: float,
    weight_kg: float,
    transport_mode: str = "truck",
    origin: str | None = None,
    destination: str | None = None,
) -> dict:
    """
    Assess whether an estimated price is fair for a given shipment.

    Compares the estimated price against baseline market rates for the
    specified transport mode and route.

    Returns a dict with:
        - is_fair: bool
        - deviation_pct: float (percentage deviation from baseline)
        - baseline_per_kg: float
        - message: str
    """
    baseline_per_kg = _BASELINE_PRICES.get(transport_mode, _BASELINE_PRICES["truck"])
    baseline_total = baseline_per_kg * weight_kg
    deviation_pct = ((estimated_price - baseline_total) / baseline_total) * 100 if baseline_total else 0

    # Define fairness thresholds
    if abs(deviation_pct) <= 20:
        is_fair = True
        label = "justo"
    elif deviation_pct < -40:
        is_fair = True
        label = "buen precio"
    elif deviation_pct > 40:
        is_fair = False
        label = "caro"
    else:
        is_fair = True
        label = "precio razonable"

    message = (
        f"{label}: ${estimated_price:.2f} vs baseline ${baseline_total:.2f} "
        f"({deviation_pct:.1f}% {'abajo' if deviation_pct < 0 else 'arriba'})"
    )

    return {
        "is_fair": is_fair,
        "deviation_pct": round(deviation_pct, 1),
        "baseline_per_kg": baseline_per_kg,
        "message": message,
    }


def search_transporters(
    origin: str,
    destination: str,
    weight_kg: float,
    transport_mode: str = "truck",
) -> list[dict]:
    """
    Search for transporter options given origin, destination, and weight.

    This is a mock directory search that returns simulated transporter
    options with name, contact, and estimated price. In a production
    system, this would query a database or API of registered transporters.

    Returns a list of at least 5 transporter options, each with:
        - name: Transporter company name
        - contact: Phone/email for contact
        - estimated_price: Total estimated price for the shipment
        - fairness: dict from assess_fairness()
        - transport_mode: The transport mode used
    """
    # Mock transporter directory - in production this would be a DB/API query
    _MOCK_TRANSPORTERS = [
        {
            "name": "TransFlete Norte",
            "contact": "contacto@transflete-norte.com | +52 55 1234 5678",
            "estimated_price": 0,  # will be calculated below
        },
        {
            "name": "Caminos del Campo",
            "contact": "hola@caminosdelcampo.mx | +52 55 8765 4321",
            "estimated_price": 0,
        },
        {
            "name": "AgroLogística Sur",
            "contact": "info@agrologistica-sur.com | +52 55 4567 8901",
            "estimated_price": 0,
        },
        {
            "name": "Rural Transportes",
            "contact": "ventas@ruraltransportes.mx | +52 55 2345 6789",
            "estimated_price": 0,
        },
        {
            "name": "Campo Express",
            "contact": "hola@campoexpress.mx | +52 55 3456 7890",
            "estimated_price": 0,
        },
        {
            "name": "TransIntermodal",
            "contact": "contacto@transintermodal.com | +52 55 4567 1234",
            "estimated_price": 0,
        },
    ]

    # Calculate estimated price: baseline rate * weight (with route factor)
    # Route factor: longer distances get slightly better rates
    distance_factor = 1.0
    if origin and destination:
        # Simple heuristic: longer distance = better rate up to a point
        dist_key = f"{origin}-{destination}"
        # In a real system, we'd use a distance matrix API here
        _ROUTE_FACTORS = {
            "michoacan-mexico": 0.95,
            "jal-veracruz": 0.90,
            "default": 1.0,
        }
        distance_factor = _ROUTE_FACTORS.get(dist_key, 1.0)

    baseline_per_kg = _BASELINE_PRICES.get(transport_mode, _BASELINE_PRICES["truck"])
    raw_price = baseline_per_kg * weight_kg * distance_factor

    # Add some realistic variation (±15%) to simulate different quoting practices
    import random
    random.seed(hash(origin + destination) % 2**31)  # deterministic per route

    options = []
    for t in _MOCK_TRANSPORTERS:
        # Each transporter quotes slightly different prices
        quote_variation = random.uniform(0.85, 1.15)
        estimated = round(raw_price * quote_variation, 2)
        fairness = assess_fairness(estimated, weight_kg, transport_mode, origin, destination)

        options.append(
            {
                "name": t["name"],
                "contact": t["contact"],
                "estimated_price": estimated,
                "fairness": fairness,
                "transport_mode": transport_mode,
            }
        )

    # Sort by estimated price (ascending)
    options.sort(key=lambda x: x["estimated_price"])

    return options[:8]  # Return top 8 (at least 5 guaranteed)


def find_transporter_options(
    origin: str,
    destination: str,
    weight_kg: float,
    transport_mode: str = "truck",
) -> list[dict]:
    """
    Main entry point: find transporter options and assess price fairness.

    Given an origin, destination, and amount of material (weight), this function
    searches the transporter directory and returns at least 5 options with:
        - name
        - contact
        - estimated price
        - fairness assessment

    Usage:
        options = find_transporter_options(
            origin="michoacan",
            destination="veracruz",
            weight_kg=500,
            transport_mode="truck",
        )
        for opt in options:
            print(f"{opt['name']}: ${opt['estimated_price']} - {opt['fairness']['message']}")
    """
    options = search_transporters(origin, destination, weight_kg, transport_mode)

    # Ensure we have at least 5 options
    if len(options) < 5:
        # Pad with generic options if needed
        for i in range(5 - len(options)):
            baseline = _BASELINE_PRICES.get(transport_mode, 1.80)
            estimated = round(baseline * weight_kg, 2)
            options.append(
                {
                    "name": f"Transportadora Secundaria {i + 1}",
                    "contact": "por consultar",
                    "estimated_price": estimated,
                    "fairness": assess_fairness(estimated, weight_kg, transport_mode),
                    "transport_mode": transport_mode,
                }
            )

    return options[:8]


if __name__ == "__main__":
    # Example usage
    print("=== Opciones de transporte ===\n")
    options = find_transporter_options(
        origin="michoacan",
        destination="veracruz",
        weight_kg=500,
        transport_mode="truck",
    )

    for i, opt in enumerate(options, 1):
        print(f"{i}. {opt['name']}")
        print(f"   Precio estimado: ${opt['estimated_price']}")
        print(f"   Contacto: {opt['contact']}")
        print(f"   Evaluación: {opt['fairness']['message']}")
        print(f"   Justo: {'Sí' if opt['fairness']['is_fair'] else 'No'}")
        print()