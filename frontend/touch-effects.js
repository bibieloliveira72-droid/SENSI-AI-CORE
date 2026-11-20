(function () {
  "use strict";

  const canvas = document.getElementById("touchTrailCanvas");
  if (!canvas) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  let width = 0;
  let height = 0;
  let ratio = 1;
  let frame = 0;
  let points = [];
  const lastByPointer = new Map();
  const MAX_POINTS = 150;

  function resize() {
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function requestDraw() {
    if (!frame && !document.hidden) frame = window.requestAnimationFrame(draw);
  }

  function addPoint(event) {
    if (document.hidden) return;
    const x = event.clientX;
    const y = event.clientY;
    const previous = lastByPointer.get(event.pointerId);
    if (previous) {
      const dx = x - previous.x;
      const dy = y - previous.y;
      const distance = Math.hypot(dx, dy);
      const steps = Math.min(7, Math.max(1, Math.ceil(distance / 12)));
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        points.push({
          x: previous.x + dx * t,
          y: previous.y + dy * t,
          life: 1,
          pointerId: event.pointerId,
          size: event.pointerType === "touch" ? 2.3 : 1.7
        });
      }
    } else {
      points.push({ x: x, y: y, life: 1, pointerId: event.pointerId, size: 2.6 });
    }
    lastByPointer.set(event.pointerId, { x: x, y: y });
    if (points.length > MAX_POINTS) points.splice(0, points.length - MAX_POINTS);
    requestDraw();
  }

  function draw() {
    frame = 0;
    context.clearRect(0, 0, width, height);
    context.save();
    context.globalCompositeOperation = "lighter";

    for (let i = points.length - 1; i >= 0; i -= 1) {
      const point = points[i];
      point.life -= 0.018;
      if (point.life <= 0) {
        points.splice(i, 1);
        continue;
      }

      const alpha = Math.max(0, point.life);
      const radius = point.size * (0.55 + alpha * 0.7);
      context.beginPath();
      context.fillStyle = "rgba(99,244,226," + (alpha * 0.32) + ")";
      context.shadowBlur = 12 * alpha;
      context.shadowColor = "rgba(99,244,226,.65)";
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fill();

      if (i > 0) {
        const previous = points[i - 1];
        if (previous.pointerId === point.pointerId) {
          context.beginPath();
          context.strokeStyle = "rgba(99,210,255," + (Math.min(alpha, previous.life) * 0.32) + ")";
          context.lineWidth = 1.1 + alpha * 1.2;
          context.shadowBlur = 9 * alpha;
          context.moveTo(previous.x, previous.y);
          context.lineTo(point.x, point.y);
          context.stroke();
        }
      }

      for (let j = i - 2; j >= 0 && j > i - 7; j -= 1) {
        const other = points[j];
        if (other.pointerId === point.pointerId) continue;
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        if (distance < 74) {
          context.beginPath();
          context.strokeStyle = "rgba(168,140,255," + ((1 - distance / 74) * alpha * 0.16) + ")";
          context.lineWidth = 0.7;
          context.shadowBlur = 0;
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
      }
    }

    context.restore();
    if (points.length) requestDraw();
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointerdown", addPoint, { passive: true });
  window.addEventListener("pointermove", addPoint, { passive: true });
  window.addEventListener("pointerup", function (event) { lastByPointer.delete(event.pointerId); }, { passive: true });
  window.addEventListener("pointercancel", function (event) { lastByPointer.delete(event.pointerId); }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      points = [];
      lastByPointer.clear();
      context.clearRect(0, 0, width, height);
    }
  });

  resize();
})();
