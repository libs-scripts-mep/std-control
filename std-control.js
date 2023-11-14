/**
 * # Exemplos
 * 
 * ```js
 * this.Std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1")
 * ```
 */
export default class SmartTestDevice {
    constructor(upRelay, downRelay, topLimitSwitch, bottomLimitSwitch, bimanual, emergency) {
        /**Entrada do DAQ referente ao acionamento da microchave que detecta o limite `inferior` da movimentação do motor */
        this.BottomLimitSwitch = bottomLimitSwitch
        /**Entrada do DAQ referente ao acionamento da microchave que detecta o limite `superior` da movimentação do motor */
        this.TopLimitSwitch = topLimitSwitch
        /**Entrada do DAQ referente ao botão de `emergência`*/
        this.Emergency = emergency
        /**Relé do DAQ referente ao comando de `descida` do motor*/
        this.DownRelay = downRelay
        /**Relé do DAQ referente ao comando de `subida` do motor*/
        this.UpRelay = upRelay
        /**Entrada do DAQ referente aos botões de comando `bimanual`*/
        this.Bimanual = bimanual
        /**Flag que disponibiliza status de acionamento do botão de `emergência`*/
        this.EmergencyTriggered = false
    }

    static MOVING_TIMEOUT = "Motor demorou para chegar ao destino"
    static MOVING_SUCESS = "Motor atuou como esperado"
    static MOVING_INTERRUPT = "Movimentação do motor interrompida!"

    static BIMANUAL_TIMEOUT = "Bimanual não detectado dentro do tempo esperado"
    static BIMANUAL_TRIGGERED = "Entrada bimanual detectada"
    static BIMANUAL_ALWAYS_TRIGGERED = "Entrada bimanual sempre acionada"

    static EMERGENCY_TRIGGERED = "Emergência acionada!"
    static EMERGENCY_ALWAYS_TRIGGERED = "Emergência sempre acionada!"

    /**
     * 
     * @param {Number} timeOut 
     * @param {Boolean} expectedLevel 
     * @returns Object
     * 
     * # Exemplos
     * 
     * ```js
     * this.Std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1")
     * const result = await this.Std.MoveDown()
     * ```
     * 
     * ## Result
     * 
     * ```js
     * {result: Boolean, msg: String}
     * ```
     */
    async MoveDown(timeOut = 5000, expectedLevel = false) {

        return new Promise((resolve) => {

            let awaitsMoving = setInterval(() => {
                if (this.EmergencyTriggered) {

                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)
                    DAQ.desligaRele(this.UpRelay)
                    resolve({ result: false, msg: SmartTestDevice.MOVING_INTERRUPT })

                } else if (DAQ.in[this.BottomLimitSwitch].value == expectedLevel) {
                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)
                    DAQ.desligaRele(this.DownRelay)
                    resolve({ result: true, msg: SmartTestDevice.MOVING_SUCESS })

                } else {
                    if (DAQ.in[this.Bimanual].value == true) {
                        DAQ.ligaRele(this.DownRelay)
                    } else {
                        DAQ.desligaRele(this.DownRelay)
                    }
                }
            }, 100)

            let movingTimeOut = setTimeout(() => {
                clearInterval(awaitsMoving)
                DAQ.desligaRele(this.DownRelay)
                resolve({ result: false, msg: SmartTestDevice.MOVING_TIMEOUT })
            }, timeOut)
        })

    }

    /**
     * 
     * @param {Number} timeOut 
     * @param {Boolean} expectedLevel 
     * @returns Object
     * 
     * # Exemplos
     * 
     * ```js
     * this.Std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1")
     * const result = await this.Std.MoveUp()
     * ```
     * 
     * ## Result
     * 
     * ```js
     * {result: Boolean, msg: String}
     * ```
     */
    async MoveUp(timeOut = 5000, expectedLevel = false) {

        return new Promise((resolve) => {
            let awaitsMoving = setInterval(() => {
                if (this.EmergencyTriggered) {

                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)
                    DAQ.desligaRele(this.UpRelay)
                    resolve({ result: false, msg: SmartTestDevice.MOVING_INTERRUPT })

                } else if (DAQ.in[this.TopLimitSwitch].value == expectedLevel) {

                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)

                    DAQ.desligaRele(this.UpRelay)
                    resolve({ result: true, msg: SmartTestDevice.MOVING_SUCESS })
                } else {
                    DAQ.ligaRele(this.UpRelay)
                }
            }, 100)

            let movingTimeOut = setTimeout(() => {
                clearInterval(awaitsMoving)
                DAQ.desligaRele(this.UpRelay)
                resolve({ result: false, msg: SmartTestDevice.MOVING_TIMEOUT })
            }, timeOut)
        })
    }

    /**
     * 
     * @param {String} input 
     * @param {Number} timeOut 
     * @param {Boolean} expectedLevel
     * @returns Object
     * 
     * # Exemplos
     * 
     * ## Utilizando parâmetros default
     * 
     * ```js
     * this.Std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1")
     * const result = await this.Std.BimanualObserver()
     * ```
     * 
     * ## Utilizando parâmetros personalizados
     * 
     * Passa 5000 para `timeout`, mantendo o valor default para `input` e `expecctedLevel`:
     * ```js
     * const result = await this.Std.BimanualObserver(undefined, 5000)
     * ```
     * 
     * ## Result
     * 
     * ```js
     * {result: Boolean, msg: String}
     * ```
     */
    async BimanualObserver(input = this.Bimanual, timeout = 15000, expectedLevel = true) {
        return new Promise((resolve) => {
            if (DAQ.in[input].value == !expectedLevel) {

                DAQ.in[input].onChange = (logicLevel) => {
                    if (logicLevel == expectedLevel) {
                        clearTimeout(timeOutMonitor)
                        resolve({ result: true, msg: SmartTestDevice.BIMANUAL_TRIGGERED })
                    }
                }
            } else {
                resolve({ result: false, msg: SmartTestDevice.BIMANUAL_ALWAYS_TRIGGERED })
            }

            const timeOutMonitor = setTimeout(() => {
                DAQ.in[input].onChange = () => { }
                resolve({ result: false, msg: SmartTestDevice.BIMANUAL_TIMEOUT })
            }, timeout)
        })
    }

    /**
     * 
     * @param {Number} input 
     * @returns Object
     * 
     * # Exemplos
     * 
     * Utilizando parâmetros default:
     * 
     * ```js
     * this.Std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1")
     * const result = await this.Std.EmergencyObserver()
     * ```
     * 
     * ## Result
     * 
     * ```js
     * {result: Boolean, msg: String}
     * ```
     */
    async EmergencyObserver(input = this.Emergency) {
        return new Promise((resolve) => {
            if (DAQ.in[input].value == true) {
                DAQ.in[input].onChange = (logicLevel) => {
                    if (logicLevel == false) {
                        this.EmergencyTriggered = true
                        resolve({ triggered: true, msg: SmartTestDevice.EMERGENCY_TRIGGERED })
                    }
                }
            } else {
                resolve({ triggered: false, msg: SmartTestDevice.EMERGENCY_ALWAYS_TRIGGERED })
            }
        })
    }
}