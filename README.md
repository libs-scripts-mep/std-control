# Controle STD - Smart Test Device (BS-80)

Bibloteca que auxilia no controle dos motores da base STD (BS-80)

## Instalando

Abra o terminal, e na pasta do script, execute:

```npm i @libs-scripts-mep/std-control```

Após fianlizada a instalação da biblioteca, inclua em seu html:

```html
<script src="node_modules/@libs-scripts-mep/std-control/std-control.js"></script>
```

<br>

> ⚠️ Se seu projeto não utiliza a biblioteca [reles-daq](https://www.npmjs.com/package/@libs-scripts-mep/reles-daq), será necessário incluir também em seu html:

```html
<!-- DEPENDENCIAS -->
<script src="node_modules/@libs-scripts-mep/reles-daq/reles-daq.js"></script>
<!-- BIBLIOTECA -->
<script src="node_modules/@libs-scripts-mep/std-control/std-control.js"></script>
```

> ⚠️Fique atento à ordem de carregamento dos arquivos, as dependências devem ser carregadas ANTES da biblioteca, como no trecho acima.

## Resumo da Classe

```js

class SmartTestDeviceControl {
    /**
     * @param {Array} releSobe array contendo o rele responsavel por fazer a base subir o motor
     * @param {Array} releDesce array contendo o rele responsavel por fazer a base descer o motor
     * @param {string} fimDeCursoSuperior string informando a entrada relacionada ao fim de curso superior
     * @param {string} fimDeCursoInferior string informando a entrada relacionada ao fim de curso inferior
     */
    constructor(releSobe, releDesce, fimDeCursoSuperior, fimDeCursoInferior) {
        this.ReleSobe = releSobe
        this.ReleDesce = releDesce
        this.FimDeCursoInferior = fimDeCursoInferior
        this.FimDeCursoSuperior = fimDeCursoSuperior
    }

    /**
     * Atua na descida do motor, até identificar o acionamento do fim de curso, ou estouro de timeout.
     * 
     * @param {function} callback 
     * @param {number} timeOut 
     */
    DesceMotor(callback, timeOut = 5000) {
        Reles.LigaReles(this.ReleDesce, () => {
            let aguardaFechamento = setInterval(() => {
                if (this.FimDeCursoInferior) {
                    clearInterval(aguardaFechamento)
                    clearTimeout(timeOutFechamento)
                    callback(true)
                }
            }, 100)
            let timeOutFechamento = setTimeout(() => {
                clearInterval(aguardaFechamento)
                callback(false)
            }, timeOut)
        })
    }

    /**
     * Atua na subida do motor, até identificar o acionamento do fim de curso, ou estouro de timeout.
     * 
     * @param {function} callback 
     * @param {number} timeOut 
     */
    SobeMotor(callback, timeOut = 5000) {
        Reles.LigaReles(this.ReleSobe, () => {
            let aguardaFechamento = setInterval(() => {
                if (this.FimDeCursoSuperior) {
                    clearInterval(aguardaFechamento)
                    clearTimeout(timeOutFechamento)
                    callback(true)
                }
            }, 100)
            let timeOutFechamento = setTimeout(() => {
                clearInterval(aguardaFechamento)
                callback(false)
            }, timeOut)
        })
    }

    /**
     * Inicia monitoramento da entrada informada, caso desacionada, trava a execução do script
     * 
     * OBS: por segurança, só é aceito no monitoramento o DESACIONAMENTO da entrada.
     * 
     * @param {string} entrada 
     * @param {number} interval 
     */
    ObserverEmergencia(entrada, interval) {
        let monitor = setInterval(() => {
            if (entrada) {
                pvi.runInstructionS("RESET", [])
                location.reload()
            }
        }, interval)
    }
}

```

## Exemplo de Utilização

```js
//Main.js

class Main {
    constructor() {
        this.STD = new SmartTestDeviceControl([1], [3], "ac5", "ac6")
    }

	MaquinaDeEstados(estado) {
		switch (estado) {

            case "Bimanual":
                UI.setMsg("Coloque o controlador na base e pressione o bi-manual.")

                //verifica se o motor está na posição inicial
                if (pvi.daq.in[this.STD.FimDeCursoSuperior].value) {

                    let aguardaBimanual = setInterval(() => {

                        //aguarda acionamento do bimanual para atuar no motor
                        if (pvi.daq.in[entradaBimanual].value) {
                            
                            clearInterval(aguardaBimanual)
                            clearTimeout(timeOutBimanual)

                            //Atua na descida do motor
                            this.STD.DesceMotor((retornoDescida) => {

                                if (retornoDescida) {
                                    //segue o teste..
                                }
                                else {
                                    //seta as devidas falhas
                                    //segue o teste..
                                }
                            })
                        }
                    }, 100)

                    let timeOutBimanual = setTimeout(() => {
                        clearInterval(aguardaBimanual)
                        //seta as devidas falhas
                        //segue o teste..
                    }, timeOut)

                } else {

                    //Atua na subida do motor para colocar no estado inicial
                    this.STD.SobeMotor((retornoSubida) => {

                        if (retornoSubida) {

                            //chama novamente o mesmo estado para iniciar o teste
                            this.MaquinaDeEstados(MaqEstado.Att(this.Estados, "Executar"))
                            
                        } else {
                            //seta as devidas falhas
                            //segue o teste..
                        }
                    })
                }
                break
		}
	}
}
```