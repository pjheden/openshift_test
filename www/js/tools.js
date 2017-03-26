function normalize(x, y){
  var u = {
    x: 0,
    y: 0
  };
  var absV = Math.sqrt(Math.pow(x,2) + Math.pow(y, 2));

  u.x = x / absV; u.y = y / absV;
  return u;
}

function lengthVec(x,y){
  return  Math.sqrt(Math.pow(x,2) + Math.pow(y, 2));
}

function dotVec(v1, v2){
  return v1.x * v2.x + v1.y * v2.y;
}

function inArray(str, arr){
  for( i = 0; i < arr.length; i++){
    if(str == arr[i]){
      return true;
    }
  }
  return false;
}