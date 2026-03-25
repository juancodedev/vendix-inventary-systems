#!/usr/bin/env sh

set -eu

BASE_URL="${BASE_URL:-http://localhost:3000}"
TENANT_ID="${TENANT_ID:-default-tenant}"
PLAN_CODE="${PLAN_CODE:-BASIC}"
SUCCESS_URL="${SUCCESS_URL:-${BASE_URL}/subscription?status=success}"
CANCEL_URL="${CANCEL_URL:-${BASE_URL}/pricing?status=cancelled}"

subscribe_payload() {
    cat <<EOF
{
  "planCode": "${PLAN_CODE}",
  "successUrl": "${SUCCESS_URL}",
  "cancelUrl": "${CANCEL_URL}"
}
EOF
}

print_section() {
    printf '\n== %s ==\n' "$1"
}

run_subscribe_test() {
    print_section "POST /api/subscribe"

    response_file="$(mktemp)"
    status_code="$({
        curl -sS -o "$response_file" -w '%{http_code}' \
            -X POST "${BASE_URL}/api/subscribe" \
            -H 'Content-Type: application/json' \
            -H "x-tenant-id: ${TENANT_ID}" \
            --data "$(subscribe_payload)"
    })"

    printf 'status=%s\n' "$status_code"
    cat "$response_file"
    rm -f "$response_file"

    case "$status_code" in
        200)
            printf '\nsubscribe smoke test: OK\n'
            ;;
        *)
            printf '\nsubscribe smoke test: FAILED\n' >&2
            exit 1
            ;;
    esac
}

run_webhook_negative_test() {
    print_section "POST /api/webhooks/stripe (unsigned negative test)"

    response_file="$(mktemp)"
    status_code="$({
        curl -sS -o "$response_file" -w '%{http_code}' \
            -X POST "${BASE_URL}/api/webhooks/stripe" \
            -H 'Content-Type: application/json' \
            --data '{"id":"evt_smoke_unsigned","type":"invoice.paid","data":{"object":{"id":"in_smoke"}}}'
    })"

    printf 'status=%s\n' "$status_code"
    cat "$response_file"
    rm -f "$response_file"

    case "$status_code" in
        400|500)
            printf '\nwebhook negative smoke test: OK (signature validation active or webhook secret missing)\n'
            ;;
        *)
            printf '\nwebhook negative smoke test: FAILED\n' >&2
            exit 1
            ;;
    esac
}

print_next_steps() {
    print_section "Stripe CLI integration smoke"
    cat <<EOF
Ejecuta estos comandos para validar webhook firmado real:

stripe listen --forward-to ${BASE_URL}/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
EOF
}

run_subscribe_test
run_webhook_negative_test
print_next_steps
