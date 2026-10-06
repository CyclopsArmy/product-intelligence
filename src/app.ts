import {startApp} from './server.ts';
try {
 const args=process.argv.slice(2);const options:{dbPath?:string;port?:number}={};
 for(let i=0;i<args.length;i+=2){if(!['--db','--port'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw new Error('INVALID_ARGUMENT');const k=args[i]==='--db'?'dbPath':'port';if(Object.hasOwn(options,k))throw new Error('INVALID_ARGUMENT');if(k==='port'){if(!/^\d+$/.test(args[i+1]))throw new Error('INVALID_PORT');options.port=Number(args[i+1]);}else options.dbPath=args[i+1];}
 const app=await startApp(options);
 console.log('Product Intelligence — private local workspace');
 console.log('Open this private session link in your browser. Do not share the link:');
 console.log(app.url+'/#token='+app.token);
 console.log('Press Ctrl+C to stop. Retailer acquisition is not configured.');
 let closing=false;const close=async()=>{if(closing)return;closing=true;await app.close();};process.once('SIGINT',close);process.once('SIGTERM',close);
}catch(e){const code=e instanceof Error&&/^[A-Z][A-Z0-9_]{2,79}$/.test(e.message)?e.message:'START_FAILED';console.error(code);process.exitCode=1;}
