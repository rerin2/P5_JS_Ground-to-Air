
// 대공포 게임

// [대공포 위치]: 포탑 중심 좌표 (포신이 도는 기준점) - 왼쪽 아래 구석
let gunX = 70;
let gunY = 840;

// [땅 높이]: 이 y값보다 아래는 땅
let groundY = 860;

// [미사일]: 미사일 1개 = { x, y, dirX, dirY, speed }
//  x, y       : 미사일 머리(앞 끝) 위치
//  dirX, dirY : 날아가는 방향 (길이 1짜리 방향)
//  speed      : 한 프레임에 움직이는 거리
let missiles = [];

// [포탄]: 포탄 1개 = { x, y, vx, vy }
//  x, y   : 포탄 위치
//  vx, vy : 한 프레임에 움직이는 가로, 세로 거리
let bullets = [];

// [마지막 발사 프레임]: 포구 화염을 잠깐 보여주기 위해 기억
let lastFireFrame = -100;

// [폭발 목록]: 폭발 1개 = { x, y, life }
//  life : 남은 프레임 수 (0이 되면 사라짐)
let booms = [];

// [게임 상태]
let hp = 30;            // 대공포 체력
let score = 0;          // 격추한 미사일 수
let isGameOver = false; // HP가 0이 되면 true
let startFrame = 0;     // 게임을 시작한 프레임 (속도 계산 기준)

function setup() {
  createCanvas(800, 920); // 세로로 긴 캔버스 (1920x1080 화면에서 안 잘리는 높이)
}


function draw() {
  drawBackground(); // 하늘과 땅 그리기

  // 게임 중일 때만 미사일 생성과 발사
  if (!isGameOver) {
    // 60프레임(약 1초)마다 미사일 1개 생성
    if (frameCount % 60 === 0) {
      spawnMissile();
    }

    // [연사]: 마우스를 누르고 있는 동안 매 프레임 1발 (초당 약 60발)
    if (mouseIsPressed) {
      fireBullet();
      // fireBullet();
    }
  }

  updateMissiles(); // 미사일 이동 + 그리기 (땅에 닿으면 HP 감소)
  updateBullets();  // 포탄 이동 + 그리기
  checkHits();      // 포탄과 미사일 충돌 검사
  drawBooms();      // 폭발 그리기
  drawGun();        // 대공포 그리기
  drawUI();         // HP, 속도 범위, 점수, Your Died
}

// [배경]: 하늘과 땅
function drawBackground() {
  background(135, 200, 235); // 하늘색으로 화면 전체 칠하기

  noStroke();                         // 테두리 없음
  fill(90, 140, 70);                  // 땅 색 (초록)
  rect(0, groundY, width, height - groundY); // 화면 아래쪽 땅
}

// [대공포]: 몸체, 포신, 포탑
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

// [미사일 생성]: 화면 위쪽 또는 오른쪽 밖에서 대공포를 향해 출발
function spawnMissile() {
  let m = {}; // 미사일 1개

  // 위쪽, 오른쪽 중 하나를 랜덤으로 고르기
  if (random(0, 1) < 0.5) {
    // [위쪽]: 화면 위 바로 바깥, 가로는 아무 데나
    m.x = random(0, width);
    m.y = random(-80, -40);
  } 
  else {
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
  let bonus = getSpeedBonus();
  m.speed = random(3 + bonus, 10 + bonus); // 처음 3~10 → 최대 103~110

  missiles.push(m); // 배열에 추가
}

// [미사일 이동]: 모든 미사일을 움직이고, 남길 미사일만 새 배열에 담기
function updateMissiles() {
  let alive = []; // 다음 프레임에도 남을 미사일

  for (let i = 0; i < missiles.length; i++) {
    let m = missiles[i]; // 현재 미사일

    // 포탄에 맞은 미사일(dead)은 건너뜀 = 새 배열에 안 넣음
    if (!m.dead) {
      m.x += m.dirX * m.speed; // 방향 × 속도만큼 가로 이동
      m.y += m.dirY * m.speed; // 방향 × 속도만큼 세로 이동

      // 머리가 땅에 닿으면 = 대공포 피격
      if (m.y >= groundY) {
        addBoom(m.x, groundY);  // 떨어진 자리에 폭발
        if (hp > 0) {
          hp -= 1;              // HP 1 감소
        }
        if (hp === 0) {
          isGameOver = true;    // HP가 0이면 게임 오버
        }
        // 새 배열에 넣지 않음 = 미사일 제거
      } 
      else {
        drawMissile(m);   // 아직 공중이면 그리기
        alive.push(m);    // 새 배열에 남기기
      }
    }
  }

  missiles = alive; // 남은 미사일만으로 배열 교체
}

// [미사일 그리기]: 날아가는 방향을 따라 선으로 그림 (회전 없이)
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

// [포탄 발사]: 포신 끝에서 마우스 방향으로 포탄 1발 추가
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

// [포탄 이동]: 모든 포탄을 움직이고, 남길 포탄만 새 배열에 담기
function updateBullets() {
  let alive = []; // 다음 프레임에도 남을 포탄

  for (let i = 0; i < bullets.length; i++) {
    let b = bullets[i]; // 현재 포탄

    // 미사일을 맞힌 포탄(dead)은 건너뜀 = 새 배열에 안 넣음
    if (!b.dead) {
      b.x += b.vx; // 가로 이동
      b.y += b.vy; // 세로 이동

      // 화면 안이고 땅 위일 때만 그리고 남기기 (밖으로 나가면 제거)
      if (b.x > -20 && b.x < width + 20 && b.y > -20 && b.y < groundY) {
        // [예광탄]: 진행 방향 뒤로 짧게 꼬리를 그린 밝은 선
        stroke(255, 200, 80);  // 주황빛 노란색
        strokeWeight(3);
        line(b.x, b.y, b.x - b.vx, b.y - b.vy); // 한 프레임 전 위치까지
        alive.push(b);         // 새 배열에 남기기
      }
    }
  }

  bullets = alive; // 남은 포탄만으로 배열 교체
}

// [이벤트 함수]: 마우스를 누르는 순간 1번 실행 → 첫 발 바로 발사
function mousePressed() {
  if (!isGameOver) {
    fireBullet();
  }
}

// [이벤트 함수]: 키를 누르는 순간 1번 실행 → r 키로 다시 시작
function keyPressed() {
  if (key === 'r' || key === 'R') {
    resetGame();
  }
}

// [속도 증가]: 게임 시작 후 5초(300프레임)마다 1씩 증가, 최대 100
function getSpeedBonus() {
  let steps = floor((frameCount - startFrame) / 300); // 지난 5초 묶음 수 (정수)
  return constrain(steps, 0, 100);
}

// [충돌 검사]:
function checkHits() {
  for (let i = 0; i < missiles.length; i++) {
    let m = missiles[i];

    // 미사일 몸통 가운데 (머리에서 20px 뒤)
    let mx = m.x - m.dirX * 20;
    let my = m.y - m.dirY * 20;

    for (let j = 0; j < bullets.length; j++) {
      let b = bullets[j];

      // 포탄이 한 프레임에 60px나 움직여서 미사일을 건너뛸 수 있으므로
      // 지금 위치, 1/2 전 위치 두 곳을 검사
      let d1 = dist(b.x, b.y, mx, my);
      let d2 = dist(b.x - b.vx / 2, b.y - b.vy / 2, mx, my);

      // 둘 다 아직 안 맞았고, 가까우면 격추
      if (!m.dead && !b.dead && (d1 < 30 || d2 < 30)) {
        addBoom(mx, my);  // 미사일 자리에 폭발
        score += 1;       // 점수 +1
        m.dead = true;    // 미사일 표시 → 다음 프레임 updateMissiles에서 빠짐
        b.dead = true;    // 포탄 표시 → 다음 프레임 updateBullets에서 빠짐
      }
    }
  }
}

// [폭발 추가]: (x, y)에 20프레임짜리 폭발 생성
function addBoom(x, y) {
  let e = {};
  e.x = x;
  e.y = y;
  e.life = 20;   // 20프레임(약 0.3초) 동안 보임
  booms.push(e);
}

// [폭발 그리기]: 점점 커지며 사라짐
function drawBooms() {
  let alive = []; // 다음 프레임에도 남을 폭발

  for (let i = 0; i < booms.length; i++) {
    let e = booms[i];

    // e.life는 화면에 남아 있는 프레임 수
    let size = (20 - e.life) * 3 + 20; // 시간이 갈수록 커짐 (20 → 77)

    // [불덩이]: 바깥 주황, 안쪽 노랑 (life가 줄수록 투명해짐)
    noStroke();
    fill(255, 120, 30, e.life * 12);
    ellipse(e.x, e.y, size, size);
    fill(255, 230, 120, e.life * 12);
    ellipse(e.x, e.y, size / 2, size / 2);

    // [불꽃]: 주변에 랜덤 점
    stroke(255, 250, 200);
    strokeWeight(3);
    point(e.x + random(-size / 2, size / 2), e.y + random(-size / 2, size / 2));
    point(e.x + random(-size / 2, size / 2), e.y + random(-size / 2, size / 2));

    e.life -= 1; // 수명 1 감소
    if (e.life > 0) {
      alive.push(e); // 수명이 남았으면 남기기 (끝나면 제거)
    }
  }

  booms = alive; // 남은 폭발만으로 배열 교체
}

// [UI]: 왼쪽 위에 HP, 미사일 속도 범위, 점수 / 그 아래 Your Died
function drawUI() {
  let bonus = getSpeedBonus();

  noStroke();
  fill(20, 30, 40);  // 진한 남색 글자
  textSize(20);

  // 첫째 줄: HP   미사일 속도 범위   격추 수
  text("HP: " + hp + " / 30", 20, 35);
  text("미사일 속도: " + (3 + bonus) + " ~ " + (10 + bonus), 170, 35);
  text("격추: " + score, 450, 35);

  // 둘째 줄: 게임 오버일 때만 빨간 글자
  if (isGameOver) {
    fill(220, 30, 30);
    textSize(40);
    text("Your Died", 20, 85);

    fill(20, 30, 40);
    textSize(16);
    text("R 키를 누르면 다시 시작", 20, 112);
  }
}

// 게임 초기화
function resetGame() {
  missiles = [];            // 미사일 모두 제거
  bullets = [];             // 포탄 모두 제거
  booms = [];               // 폭발 모두 제거
  hp = 30;                  // HP 다시 30
  score = 0;                // 점수 0
  isGameOver = false;       // Your Died 지우기
  startFrame = frameCount;  // 속도 범위도 처음부터
}
