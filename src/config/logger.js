import winston from 'winston';
const logger = winston.createLogger({
    level:"info",
    format:winston.format.combine(
        winston.format.prettyPrint(),
        winston.format.timestamp({format:'YYYY-MM-DD HH:mm:ss'}),
        winston.format.printf(({level , message , timestamp})=>{
          return `[${timestamp}] ${level.toUpperCase()}: ${message}`;   
        })),
        transports:[
            new winston.transports.Console()
        ]
    
    })

export default logger;