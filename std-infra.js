import ModbusScheduler from "../modbus-scheduler/modbus-scheduler.js"
import { SerialUtil } from "../serialport-websocket/serial.js"
import { Socket } from "../serialport-websocket/client.js"
import SimuladorTemp from "../temp-sim/temp-sim.js"
import Log from "../script-loader/utils-script.js"
import { VC9 } from "../vc9/vc9.js"
import { AC9 } from "../ac9/ac9.js"

export default class STDInfrastructure {
    static scheduler = new ModbusScheduler(9600, "InfraModbus")

    static async schedulerConnect() {
        while (!Socket.IO.connected) { await SerialUtil.Delay(1000); console.log(`Aguardando conexão com server...`) }

        const getPort = await this.scheduler.getPort({ serialNumber: "INV-INFR_" })
        getPort.success
            ? Log.console(getPort.msg)
            : Log.warn(getPort.msg)

        if (!getPort.success) { return { success: false, error: getPort.msg } }

        const create = await this.scheduler.create()
        if (!create.success) { return { success: false, error: create.msg } }

        this.scheduler.addDevice(AC9, "AC9", AC9.nodeAddress)
        this.scheduler.addDevice(VC9, "AC9", VC9.nodeAddress)
        this.scheduler.addDevice(SimuladorTemp, "SimuladorTemp", SimuladorTemp.NodeAddress)

        return { success: true, error: null }
    }

    static {
        window.STDInfrastructure = STDInfrastructure
    }
}
