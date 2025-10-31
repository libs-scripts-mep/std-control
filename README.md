# Controle STD - Smart Test Device (BS-80)

Bibloteca que auxilia no controle dos motores da base STD (BS-80) e também gerencia os dispositivos da infraestrutura da jiga: AC9, VC9 e o Simulador termopar.

## Instalando

Abra o terminal, e na pasta raíz do script, execute:

```
npm i @libs-scripts-mep/std-control
```

## Desinstalando

Abra o terminal, e na pasta raíz do script, execute:

```
npm uninstall @libs-scripts-mep/std-control
```

## Atualizando

Abra o terminal, e na pasta raíz do script, execute:

```
npm uninstall @libs-scripts-mep/std-control
```

## Como utilizar

Realize a importação:

```js
import SmartTestDevice from "../node_modules/@libs-scripts-mep/std-control/std-control.js"
import STDInfrastructure from "../node_modules/@libs-scripts-mep/std-control/std-infra.js"
```

Para iniciar o gerenciamento dos dispositivos da jiga utilize:

```js 
await STDInfrastructure.schedulerConnect() 
```

As demais informações e instruções estarão disponíveis via `JSDocs`.
