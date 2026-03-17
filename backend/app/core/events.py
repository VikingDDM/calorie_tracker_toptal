import asyncio
import json
from collections import deque
from datetime import datetime, timezone
from typing import Any


class EventBus:
    def __init__(self) -> None:
        self._history: deque[dict[str, Any]] = deque(maxlen=100)
        self._subscribers: set[asyncio.Queue[str]] = set()

    def publish(self, event_type: str, payload: dict[str, Any]) -> None:
        event = {
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._history.append(event)
        message = json.dumps(event)
        for subscriber in list(self._subscribers):
            subscriber.put_nowait(message)

    def subscribe(self) -> asyncio.Queue[str]:
        queue: asyncio.Queue[str] = asyncio.Queue()
        self._subscribers.add(queue)
        for event in self._history:
            queue.put_nowait(json.dumps(event))
        return queue

    def unsubscribe(self, queue: asyncio.Queue[str]) -> None:
        self._subscribers.discard(queue)


event_bus = EventBus()
