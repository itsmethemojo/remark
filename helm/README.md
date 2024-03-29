# remark

![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square)

A Helm chart to run remark frontend in Kubernetes

## installation

```
helm upgrade --install demo .
```

## Source Code

* <https://github.com/itsmethemojo/remark>

## Requirements

| Repository | Name | Version |
|------------|------|---------|
| https://itsmethemojo.github.io/helm-charts/ | app(basic-web-app) | 1.1.0 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| app.env.AUTHORIZATION_COOKIE | string | `"Authorization"` | see Cookie where javascript can get the authorization information from |
| app.env.LOGIN_URL | string | `"/auth/start/"` | url of login page to redirect to if api calls are not authorized |
| app.env.REMARK_API | string | `"/api/v1/bookmark/"` | base url of the remark api [see](https://github.com/itsmethemojo/remark-api/) |
| app.image.repository | string | `"ghcr.io/itsmethemojo/remark"` |  |
| app.image.tag | string | `"sha-f0e6479"` |  |
| app.nameOverride | string | `"remark"` |  |

## update docs

```
docker run --rm -v $(pwd):/app -w/app jnorwood/helm-docs -t helm-docs-template.gotmpl
```

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.11.0](https://github.com/norwoodj/helm-docs/releases/v1.11.0)
