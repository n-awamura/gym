document.addEventListener('DOMContentLoaded', () => {
  const swipeContainer = document.getElementById('swipe-container');
  const mapFrame = document.getElementById('mapFrame');

  if (!swipeContainer || !mapFrame) {
    console.error('必要な要素が見つかりません。');
    return;
  }

  const pages = ['map.html', 'map2.html'];
  let currentPageIndex = 0;
  let touchStartX = 0;
  let touchEndX = 0;
  const swipeThreshold = 50; // スワイプと判定する最小距離 (px)

  function updateIframeAndIndicator() {
    mapFrame.src = pages[currentPageIndex];
  }

  // タッチイベント
  swipeContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  swipeContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
  }, { passive: true });

  // マウスドラッグ操作
  let isDragging = false;
  swipeContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    touchStartX = e.clientX;
  });

  swipeContainer.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    touchEndX = e.clientX;
  });

  swipeContainer.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    handleSwipe();
  });

  // キーボードショートカット
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentPageIndex > 0) {
      currentPageIndex--;
      updateIframeAndIndicator();
    } else if (e.key === 'ArrowRight' && currentPageIndex < pages.length - 1) {
      currentPageIndex++;
      updateIframeAndIndicator();
    }
  });

  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance < 0 && currentPageIndex < pages.length - 1) {
        // 左スワイプ (次へ)
        currentPageIndex++;
        updateIframeAndIndicator();
      } else if (swipeDistance > 0 && currentPageIndex > 0) {
        // 右スワイプ (前へ)
        currentPageIndex--;
        updateIframeAndIndicator();
      }
    }
    // スワイプ距離が閾値以下なら何もしない
  }

  // 初期表示
  updateIframeAndIndicator();
}); 