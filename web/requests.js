// Only the newest request may publish its result. Closing a view cancels its gate.
export function requestGate(){let generation=0;return {checkpoint(){const ticket=generation;return ()=>ticket===generation;},cancel(){generation++;},async run(load,commit){const ticket=++generation;try{const value=await load();if(ticket===generation)return commit(value);}catch(error){if(ticket===generation)throw error;}}};}
// The export endpoint bounds this compact encoding. Pretty-printing can exceed it.
export const archiveText=data=>JSON.stringify(data);
