function railfenceDecrypt(cipher, rails){
  const n=cipher.length;
  const rail=Array.from({length:rails},()=>Array(n).fill('\n'));
  let dirDown=false, row=0, col=0;
  for(let i=0;i<n;i++){
    if(row===0) dirDown=true;
    if(row===rails-1) dirDown=false;
    rail[row][col]='*';
    col++;
    row+= dirDown?1:-1;
  }
  let index=0;
  for(let r=0;r<rails;r++){
    for(let c=0;c<n;c++){
      if(rail[r][c]==='*' && index<n){
        rail[r][c]=cipher[index++];
      }
    }
  }
  let result='';
  row=0; col=0; dirDown=false;
  for(let i=0;i<n;i++){
    if(row===0) dirDown=true;
    if(row===rails-1) dirDown=false;
    if(rail[row][col] !== '\n'){
      result+=rail[row][col];
      col++;
    }
    row+= dirDown?1:-1;
  }
  return result;
}

function caesarDecrypt(s,k=5){
  let out='';
  for(const ch of s){
    if(ch>='a' && ch<='z'){
      out+=String.fromCharCode((ch.charCodeAt(0)-97 - k + 26*10)%26 + 97);
    } else if(ch>='A' && ch<='Z'){
      out+=String.fromCharCode((ch.charCodeAt(0)-65 - k + 26*10)%26 + 65);
    } else {
      out+=ch;
    }
  }
  return out;
}

const cipher = "T mwipgghhgiim4eCt3 n izpeeasJa s y3sivzair l   soe.Kedi gc.f:im na ";
console.log('RailFence-5:');
console.log(railfenceDecrypt(cipher,5));
console.log('\nCaesar-5:');
console.log(caesarDecrypt(cipher,5));
