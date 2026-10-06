import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
const git=(args:string[])=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20*1024*1024});
const files=git(['ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(Boolean);
const patterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{40,}\b/,/\bAKIA[A-Z0-9]{16}\b/,/\bsk-[A-Za-z0-9_-]{30,}\b/];
const forbidden=(path:string):boolean=>{
  const parts=path.split('/');
  return parts.some((part,i)=>part.startsWith('.env') && !(part==='.env.example' && i===parts.length-1))
    || parts.some(part=>['data','captures','node_modules','reports','backups','playwright-report','test-results'].includes(part))
    || /\.pi-backup\.json$/i.test(path)
    || /\.(?:sqlite|db|har|log|png|jpe?g|webp|webm|trace|zip)(?:$|-)/i.test(path);
};
const hits:string[]=[];
function scan(label:string,body:string){if(patterns.some(p=>p.test(body)))hits.push(label+': potential credential');}
for(const file of new Set(files)){if(forbidden(file))hits.push(file+': private artifact path');if(existsSync(file))scan(file,readFileSync(file,'utf8'));}
// The index can differ from both HEAD and the working tree. Inspect the actual
// staged blobs, including unmerged stages, without changing the index.
const staged=git(['ls-files','--stage','-z']).split('\0').filter(Boolean);
for(const entry of staged){
  const tab=entry.indexOf('\t'),header=entry.slice(0,tab).split(' '),path=entry.slice(tab+1);
  if(forbidden(path))hits.push('index '+path+': private artifact path');
  if(header[0]==='160000'){hits.push('index '+path+': submodule requires separate review');continue;}
  scan('index '+path,git(['cat-file','-p',header[1]]));
}
const objects=git(['rev-list','--objects','--all']).trim().split('\n').filter(Boolean);
// A blob can appear under several names. rev-list --objects chooses one name,
// so inspect every reachable tree's paths separately before scanning content.
const commits=git(['rev-list','--all']).trim().split('\n').filter(Boolean);
for(const commit of commits){
  const paths=git(['ls-tree','-r','--name-only','-z',commit]).split('\0').filter(Boolean);
  if(paths.some(forbidden))hits.push('history: private artifact path');
}
let blobs=0;
for(const line of objects){const [sha,...path]=line.split(' ');if(git(['cat-file','-t',sha]).trim()!=='blob')continue;blobs++;if(forbidden(path.join(' ')))hits.push('history: private artifact path');scan('history blob '+sha.slice(0,12),git(['cat-file','-p',sha]));}
const authors=git(['log','--all','--format=%an <%ae>%n%cn <%ce>']).trim().split('\n').filter(Boolean);
for(const author of new Set(authors)){
  if(author==='Project Maintainers <maintainers@example.invalid>' || author==='GitHub <noreply@github.com>')continue;
  const account=/^([A-Za-z0-9-]+) <\d+\+([A-Za-z0-9-]+)@users\.noreply\.github\.com>$/.exec(author);
  if(!account || account[1].toLowerCase()!==account[2].toLowerCase())hits.push('history: unapproved author metadata');
}
console.log(JSON.stringify({passed:hits.length===0,files:new Set(files).size,historyBlobs:blobs,findings:hits,limitation:'Pattern checks cannot prove absence of all personal information. Manual publication review remains required.'},null,2));
if(hits.length)process.exitCode=1;
