# Kubernetes Manifests

This directory contains a base Kubernetes deployment layout for the Stellar Pay runtime services.

## Included Resources

- Namespace
- Shared ConfigMap
- Shared Secret
- Deployment, Service, and HorizontalPodAutoscaler for `api`
- Deployment, Service, and HorizontalPodAutoscaler for `frontend`
- Deployment, Service, and HorizontalPodAutoscaler for `admin-dashboard`
- Deployment, Service, and HorizontalPodAutoscaler for `payments-engine`
- Deployment, Service, and HorizontalPodAutoscaler for `anchor-service`
- Deployment, Service, and HorizontalPodAutoscaler for `compliance-engine`
- Deployment, Service, and HorizontalPodAutoscaler for `subscriptions`
- Deployment, Service, and HorizontalPodAutoscaler for `escrow`
- Host-based Ingress for the public surfaces

`sdk-js` is intentionally excluded because it is a client library, not a deployable Kubernetes service.

## Apply

Update the placeholder values in `secrets.yaml`, publish the referenced container images, then apply the base:

```powershell
kubectl apply -k k8s/
```

## Probe Strategy

- `api` uses `GET /health` for liveness and readiness.
- `frontend` and `admin-dashboard` use `GET /`.
- The internal engines use `GET /health` and assume each service image exposes an HTTP health endpoint.

## Validation

Client-side validation:

```powershell
kubectl apply --dry-run=client -k k8s/
```
