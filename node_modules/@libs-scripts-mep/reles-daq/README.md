# Gerenciamento de Relés do DAQ
## Instalando

Abra o terminal, e na pasta do script, rode:

```
npm i @libs-scripts-mep/reles-daq
```

## Desinstalando

Abra o terminal, e na pasta do script, rode:

```
npm uninstall @libs-scripts-mep/reles-daq
```

## Resumo da Classe

Biblioteca genérica para acionamento dos relés do DAQ.


| Versão DAQ | Suporta? |
| ---------- | -------- |
| 1.9        | ✔️        |
| 2.0        | ✔️        |

Método principal:

``` js
//Teste.js

class Reles {

    /**
     * Aceita string's e array's.
     * 
     * Formato esperado [Array's] : [1, 2, 5] 
     * 
     * formato esperado [String's] : "RL1, RL2, RL5"
     * 
     * @param {*} relesParaAcionamento 
     * @param {function} callback
     * @param {number} timeOut
     */
    static LigaReles(relesParaAcionamento, callback, timeOut) {

        if (typeof (relesParaAcionamento) === "string") {
            trata string...
            aciona reles...
            aguarda timeout...
            chama callback.

        } else if (typeof (relesParaAcionamento) === "object") {
            trata string...
            aciona reles...
            aguarda timeout...
            chama callback.
        }
    }
}
```

## Exemplo de Utilização de Buffers

>⚠️ Exclusivo para parâmetros do tipo array

<br>

``` js
//Main.js

class Main {
    constructor() {
        //Pode-se utilizar multiplos buffers
        this.BufferReles = []
    }
}    
```

Métodos para manipulação do(s) buffer(s):

``` js
//Teste.js

class Reles {

    /**
     * @param {number} relay 
     * @param {array} buffer 
     */
    static AddRelayToBuffer(relay, buffer)

    /**
     * @param {number} relay 
     * @param {array} buffer 
     */
    static RemoveRelayFromBuffer(relay, buffer)

    /**
     * @param {array} buffer 
     */
    static ClearBufferRelay(buffer)
}
```

Exemplo de manipulação e acionamento:

``` js
//Main.js

Reles.ClearBufferRelay(this.BufferReles)
Reles.AddRelayToBuffer(Setup.Reles.HabilitaSlot1, this.BufferReles)
Reles.AddRelayToBuffer(Setup.Reles.HabilitaPistao, this.BufferReles)
Reles.AddRelayToBuffer(Setup.Reles.HabilitaAlimentacao, this.BufferReles)
Reles.AddRelayToBuffer(Setup.Reles.HabilitaComunicacao, this.BufferReles)
Reles.LigaReles(this.BufferReles, () => {
    segue o teste..
})
  
```
