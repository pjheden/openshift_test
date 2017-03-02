function normalize(x, y){
  var u = {
    x: 0,
    y: 0
  };
  var absV = Math.sqrt(Math.pow(x,2) + Math.pow(y, 2));

  u.x = x / absV; u.y = y / absV;
  return u;
}
