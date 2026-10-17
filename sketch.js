
// 대공포 게임

// [대공포 위치]: 포탑 중심 좌표 (포신이 도는 기준점) - 왼쪽 아래 구석
let gunX = 70;
let gunY = 840;

// [땅 높이]: 이 y값보다 아래는 땅
let groundY = 860;

// [미사일 목록]: 미사일 1개 = { x, y, dirX, dirY, speed }
//  x, y       : 미사일 머리(앞 끝) 위치
//  dirX, dirY : 날아가는 방향 (길이 1짜리 방향)
//  speed      : 한 프레임에 움직이는 거리
let missiles = [];

// [포탄 목록]: 포탄 1개 = { x, y, vx, vy }
//  x, y   : 포탄 위치
//  vx, vy : 한 프레임에 움직이는 가로, 세로 거리
let bullets = [];

// [마지막 발사 프레임]: 포구 화염을 잠깐 보여주기 위해 기억
let lastFireFrame = -100;

function setup() {
  createCanvas(800, 920); // 세로로 긴 캔버스 (1920x1080 화면에서 안 잘리는 높이)
}


function draw() {
  drawBackground(); // 하늘과 땅 그리기

  // 60프레임(약 1초)마다 미사일 1개 생성
  if (frameCount % 60 === 0) {
    spawnMissile();
  }

  // [연사]: 마우스를 누르고 있는 동안 매 프레임 1발 (초당 약 60발)
  if (mouseIsPressed) {
    fireBullet();
    // fireBullet();
  }

  updateMissiles(); // 미사일 이동 + 그리기
  updateBullets();  // 포탄 이동 + 그리기
  drawGun();        // 대공포 그리기
}

// ---------------------------------------------------------
// [배경]: 하늘과 땅
// ---------------------------------------------------------
function drawBackground() {
  background(135, 200, 235); // 하늘색으로 화면 전체 칠하기

  noStroke();                         // 테두리 없음
  fill(90, 140, 70);                  // 땅 색 (초록)
  rect(0, groundY, width, height - groundY); // 화면 아래쪽 땅
}

// ---------------------------------------------------------
// [대공포]: 몸체, 포신, 포탑
// ---------------------------------------------------------
function drawGun() {
  // [방향 계산]: 포탑 중심 → 마우스까지의 차이와 거리
  let dx = mouseX - gunX;                   // 가로 차이
  let dy = mouseY - gunY;                   // 세로 차이
  let d = dist(gunX, gunY, mouseX, mouseY); // 두 점 사이 거리
  if (d < 1) {
    d = 1; // 거리가 0이면 나눗셈이 안 되므로 1로 고정
  }

  // [포신 끝 좌표]: 마우스 방향으로 60px 떨어진 점
  let endX = gunX + dx / d * 60;
  let endY = gunY + dy / d * 60;

  // [포신]: 포탑 중심에서 포신 끝까지 굵은 선
  stroke(50, 55, 60);  // 진한 회색
  strokeWeight(10);    // 선 굵기 10
  line(gunX, gunY, endX, endY);

  // [포구 화염]: 방금 쐈다면(2프레임 이내) 포신 끝에 노란 불꽃
  if (frameCount - lastFireFrame < 2) {
    noStroke();
    fill(255, 220, 100);                         // 밝은 노란색
    let flashX = endX + dx / d * 8;              // 포신 끝보다 조금 앞
    let flashY = endY + dy / d * 8;
    ellipse(flashX, flashY, random(14, 22), random(14, 22)); // 크기가 매번 달라 번쩍이는 느낌
  }

  // [포탑]: 위로 볼록한 반원 (포신 뿌리를 덮음)
  noStroke();
  fill(90, 100, 110);                    // 회색
  arc(gunX, gunY, 60, 60, 3.14, 6.28);   // 180도 ~ 360도 = 위쪽 반원

  // [몸체]: 포탑 아래 직사각형 받침
  fill(70, 80, 90);                // 조금 더 진한 회색
  rect(gunX - 40, gunY, 80, 20);   // 포탑 바로 아래부터 땅까지
}

// ---------------------------------------------------------
// [미사일 생성]: 화면 위쪽 또는 오른쪽 밖에서 대공포를 향해 출발
// ---------------------------------------------------------
function spawnMissile() {
  let m = {}; // 미사일 1개

  // 위쪽, 오른쪽 중 하나를 랜덤으로 고르기
  if (random(0, 1) < 0.5) {
    // [위쪽]: 화면 위 바로 바깥, 가로는 아무 데나
    m.x = random(0, width);
    m.y = random(-80, -40);
  } else {
    // [오른쪽]: 화면 오른쪽 바로 바깥, 세로는 위 ~ 650 사이
    m.x = random(width + 40, width + 80);
    m.y = random(0, 650);
  }

  // [방향 계산]: 미사일 → 대공포 받침(땅 위)까지
  let dx = gunX - m.x;
  let dy = groundY - m.y;
  let d = dist(m.x, m.y, gunX, groundY);
  m.dirX = dx / d;       // 가로 방향
  m.dirY = dy / d;       // 세로 방향

  // [속도]: 시간이 지날수록 빨라지는 범위에서 랜덤
  // 10초(600프레임)마다 1씩 증가, 최대 +10까지만
  let bonus = constrain(frameCount / 600, 0, 100);
  m.speed = random(3 + bonus, 10 + bonus); // 처음 3~10 → 최대 130~200

  missiles.push(m); // 배열에 추가
}

// ---------------------------------------------------------
// [미사일 이동]: 모든 미사일을 움직이고, 땅에 닿으면 제거
// ---------------------------------------------------------
function updateMissiles() {
  // 지우면서 돌기 때문에 뒤에서부터 거꾸로 반복
  for (let i = missiles.length - 1; i >= 0; i--) {
    let m = missiles[i]; // 현재 미사일

    m.x += m.dirX * m.speed; // 방향 × 속도만큼 가로 이동
    m.y += m.dirY * m.speed; // 방향 × 속도만큼 세로 이동

    // 머리가 땅에 닿으면 배열에서 제거
    if (m.y >= groundY) {
      missiles.splice(i, 1);
    } else {
      drawMissile(m); // 아직 공중이면 그리기
    }
  }
}

// ---------------------------------------------------------
// [미사일 그리기]: 날아가는 방향을 따라 선으로 그림 (회전 없이)
// ---------------------------------------------------------
function drawMissile(m) {
  // 꼬리 위치: 머리에서 반대 방향으로 40px
  let tailX = m.x - m.dirX * 40;
  let tailY = m.y - m.dirY * 40;

  // [날개]: 꼬리에서 진행 방향과 수직으로 뻗은 짧은 선
  stroke(70, 80, 90);
  strokeWeight(4);
  line(tailX - m.dirY * 9, tailY + m.dirX * 9,
       tailX + m.dirY * 9, tailY - m.dirX * 9);

  // [몸통]: 꼬리에서 머리 바로 뒤까지 굵은 회색 선
  stroke(200, 205, 215);
  strokeWeight(8);
  line(tailX, tailY, m.x - m.dirX * 8, m.y - m.dirY * 8);

  // [탄두]: 머리 끝 빨간 부분
  stroke(200, 50, 40);
  line(m.x - m.dirX * 8, m.y - m.dirY * 8, m.x, m.y);
}

// ---------------------------------------------------------
// [포탄 발사]: 포신 끝에서 마우스 방향으로 포탄 1발 추가
// ---------------------------------------------------------
function fireBullet() {
  // [방향 계산]: 포탑 중심 → 마우스 (drawGun과 같은 방법)
  let dx = mouseX - gunX;
  let dy = mouseY - gunY;
  let d = dist(gunX, gunY, mouseX, mouseY);
  if (d < 1) {
    d = 1; // 0으로 나누기 방지
  }

  // [탄 퍼짐]: 방향을 아주 조금씩 랜덤으로 흔들어 기관포처럼 흩어지게
  let dirX = dx / d + random(-0.03, 0.03);
  let dirY = dy / d + random(-0.03, 0.03);

  let b = {};                  // 포탄 1발
  b.x = gunX + dx / d * 60;    // 시작 위치 = 포신 끝
  b.y = gunY + dy / d * 60;
  b.vx = dirX * 60;            // 한 프레임에 60px 속도로 날아감
  b.vy = dirY * 60;

  bullets.push(b);             // 배열에 추가
  lastFireFrame = frameCount;  // 포구 화염 표시용
}

// ---------------------------------------------------------
// [포탄 이동]: 모든 포탄을 움직이고, 화면 밖이면 제거
// ---------------------------------------------------------
function updateBullets() {
  // 지우면서 돌기 때문에 뒤에서부터 거꾸로 반복
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i]; // 현재 포탄

    b.x += b.vx; // 가로 이동
    b.y += b.vy; // 세로 이동

    // 화면 밖(왼쪽, 오른쪽, 위) 또는 땅에 닿으면 제거
    if (b.x < -20 || b.x > width + 20 || b.y < -20 || b.y > groundY) {
      bullets.splice(i, 1);
    } else {
      // [예광탄]: 진행 방향 뒤로 짧게 꼬리를 그린 밝은 선
      stroke(255, 200, 80);  // 주황빛 노란색
      strokeWeight(3);
      line(b.x, b.y, b.x - b.vx, b.y - b.vy); // 한 프레임 전 위치까지
    }
  }
}

// =========================================================
// [이벤트 함수]: 마우스를 누르는 순간 1번 실행 → 첫 발 바로 발사
// =========================================================
function mousePressed() {
  fireBullet();
}
