"""RailGuard AI — Station Model"""

from __future__ import annotations
from simulation.types import (
    Platform, Train, Track, PlatformState, TrainStatus, StationState,
)
from simulation.events import EventStore, SimulationEvent, EventType
from config import StationConfig
import time
import math
import random


class Station:
    """Represents the railway station with all its components."""

    def __init__(self, config: StationConfig, event_store: EventStore):
        self.config = config
        self.event_store = event_store
        self.state = StationState.NORMAL
        self.tick = 0

        # Initialize platforms
        self.platforms: dict[int, Platform] = {}
        for p_cfg in config.platforms:
            self.platforms[p_cfg["id"]] = Platform(
                id=p_cfg["id"],
                name=p_cfg["name"],
                capacity=p_cfg["capacity"],
                x=p_cfg["x"],
                z=p_cfg["z"],
                passenger_count=random.randint(40, 120),
            )

        # Initialize tracks
        self.tracks: dict[int, Track] = {}
        for t_cfg in config.tracks:
            self.tracks[t_cfg["id"]] = Track(
                id=t_cfg["id"],
                platform_ids=t_cfg["platforms"],
                z=t_cfg["z"],
            )

        # Initialize trains
        self.trains: dict[str, Train] = {}
        self._init_trains()

        # Update initial densities
        for p in self.platforms.values():
            p.current_density = p.density_ratio()

    def _init_trains(self):
        """Create initial train schedule."""
        train_configs = [
            {"id": "T-12301", "name": "Rajdhani Express", "platform_id": 1, "track_id": 1,
             "status": TrainStatus.BOARDING, "position": 1.0, "passenger_load": 280},
            {"id": "T-12302", "name": "Shatabdi Express", "platform_id": 2, "track_id": 2,
             "status": TrainStatus.APPROACHING, "position": 0.3, "passenger_load": 350},
            {"id": "T-12303", "name": "Duronto Express", "platform_id": 3, "track_id": 2,
             "status": TrainStatus.SCHEDULED, "position": 0.0, "passenger_load": 0},
            {"id": "T-12304", "name": "Garib Rath", "platform_id": 4, "track_id": 3,
             "status": TrainStatus.BOARDING, "position": 1.0, "passenger_load": 200},
            {"id": "T-12305", "name": "Jan Shatabdi", "platform_id": 5, "track_id": 4,
             "status": TrainStatus.APPROACHING, "position": 0.6, "passenger_load": 180},
            {"id": "T-12306", "name": "Sampark Kranti", "platform_id": 6, "track_id": 4,
             "status": TrainStatus.SCHEDULED, "position": 0.0, "passenger_load": 0},
        ]
        for tc in train_configs:
            t = Train(
                id=tc["id"],
                name=tc["name"],
                platform_id=tc["platform_id"],
                track_id=tc["track_id"],
                status=tc["status"],
                position=tc["position"],
                passenger_load=tc["passenger_load"],
            )
            self.trains[t.id] = t

    def update_tick(self, tick: int):
        """Advance station state by one tick."""
        self.tick = tick

        # Update train positions
        for train in self.trains.values():
            self._update_train(train)

        # Update passenger flows
        for platform in self.platforms.values():
            self._update_platform_passengers(platform)
            self._update_platform_state(platform)

        # Update station state
        self._update_station_state()

    def _update_train(self, train: Train):
        """Update a single train's position and status."""
        if train.status == TrainStatus.APPROACHING:
            train.position = min(1.0, train.position + 0.02)
            if train.position >= 1.0:
                train.status = TrainStatus.STOPPED
                self.event_store.append(SimulationEvent(
                    type=EventType.TRAIN_ARRIVED,
                    timestamp=time.time(),
                    tick=self.tick,
                    severity="INFO",
                    message=f"{train.name} arrived at Platform {train.platform_id}",
                    metadata={"trainId": train.id, "platformId": train.platform_id},
                ))
        elif train.status == TrainStatus.STOPPED:
            # Start boarding after brief stop
            train.status = TrainStatus.BOARDING
        elif train.status == TrainStatus.BOARDING:
            # Boarding happens — passengers flow
            platform = self.platforms.get(train.platform_id)
            if platform:
                # Passengers disembark and new ones board
                disembark = min(train.passenger_load, random.randint(5, 15))
                train.passenger_load -= disembark
                platform.passenger_count += disembark
                # Some passengers board
                board = min(platform.passenger_count, random.randint(3, 10))
                platform.passenger_count -= board
                train.passenger_load += board
        elif train.status == TrainStatus.DEPARTING:
            train.position = max(-0.5, train.position - 0.03)
            if train.position <= -0.5:
                # Train has left, reset
                train.status = TrainStatus.SCHEDULED
                train.position = 0.0
                self.event_store.append(SimulationEvent(
                    type=EventType.TRAIN_DEPARTED,
                    timestamp=time.time(),
                    tick=self.tick,
                    severity="INFO",
                    message=f"{train.name} departed from Platform {train.platform_id}",
                    metadata={"trainId": train.id, "platformId": train.platform_id},
                ))

    def _update_platform_passengers(self, platform: Platform):
        """Update passenger count for natural flow."""
        if platform.is_closed:
            return

        # Natural passenger inflow (people arriving at station)
        base_inflow = random.randint(2, 8)
        # Natural outflow (people leaving)
        base_outflow = random.randint(1, 5) if platform.passenger_count > 20 else 0

        platform.inflow_rate = base_inflow
        platform.outflow_rate = base_outflow
        platform.passenger_count = max(0, platform.passenger_count + base_inflow - base_outflow)
        platform.current_density = platform.density_ratio()

    def _update_platform_state(self, platform: Platform):
        """Update platform state based on density."""
        old_state = platform.state

        if platform.is_closed:
            platform.state = PlatformState.CLOSED
        elif platform.state == PlatformState.MITIGATING:
            # Stay in mitigating until density drops
            if platform.current_density < 0.4:
                platform.state = PlatformState.RECOVERING
                self.event_store.append(SimulationEvent(
                    type=EventType.PLATFORM_STATE_CHANGED,
                    timestamp=time.time(),
                    tick=self.tick,
                    severity="INFO",
                    message=f"{platform.name} is recovering",
                    metadata={"platformId": platform.id, "state": "RECOVERING"},
                ))
        elif platform.state == PlatformState.RECOVERING:
            if platform.current_density < 0.25:
                platform.state = PlatformState.NORMAL
                self.event_store.append(SimulationEvent(
                    type=EventType.PLATFORM_STATE_CHANGED,
                    timestamp=time.time(),
                    tick=self.tick,
                    severity="INFO",
                    message=f"{platform.name} has returned to normal",
                    metadata={"platformId": platform.id, "state": "NORMAL"},
                ))
        else:
            density = platform.current_density
            if density >= 0.85:
                platform.state = PlatformState.CRITICAL
            elif density >= 0.7:
                platform.state = PlatformState.WARNING
            elif density >= 0.55:
                platform.state = PlatformState.CONGESTING
            else:
                platform.state = PlatformState.NORMAL

        # Emit event on state change
        if old_state != platform.state and old_state not in (PlatformState.MITIGATING, PlatformState.RECOVERING):
            if platform.state == PlatformState.CRITICAL:
                self.event_store.append(SimulationEvent(
                    type=EventType.CRITICAL_DENSITY_REACHED,
                    timestamp=time.time(),
                    tick=self.tick,
                    severity="CRITICAL",
                    message=f"CRITICAL: {platform.name} at {platform.current_density:.0%} capacity!",
                    metadata={"platformId": platform.id, "density": platform.current_density},
                ))
            elif platform.state == PlatformState.WARNING:
                self.event_store.append(SimulationEvent(
                    type=EventType.DENSITY_THRESHOLD_CROSSED,
                    timestamp=time.time(),
                    tick=self.tick,
                    severity="HIGH",
                    message=f"WARNING: {platform.name} density at {platform.current_density:.0%}",
                    metadata={"platformId": platform.id, "density": platform.current_density},
                ))

    def _update_station_state(self):
        """Update overall station state based on platform states."""
        states = [p.state for p in self.platforms.values()]
        if any(s == PlatformState.CRITICAL for s in states):
            self.state = StationState.CRITICAL
        elif any(s == PlatformState.MITIGATING for s in states):
            self.state = StationState.MITIGATING
        elif any(s == PlatformState.RECOVERING for s in states):
            self.state = StationState.RECOVERING
        elif any(s == PlatformState.WARNING for s in states):
            self.state = StationState.WARNING
        elif any(s == PlatformState.CONGESTING for s in states):
            self.state = StationState.MONITORING
        else:
            self.state = StationState.NORMAL

    def calculate_crisis_probability(self) -> float:
        """Calculate overall crisis probability based on current state."""
        max_density = max(p.current_density for p in self.platforms.values())
        avg_density = sum(p.current_density for p in self.platforms.values()) / len(self.platforms)

        # Weighted formula
        base_risk = max_density * 0.6 + avg_density * 0.2

        # Factor in closed platforms
        closed_count = sum(1 for p in self.platforms.values() if p.is_closed)
        closure_risk = closed_count * 0.15

        # Factor in signal failures
        signal_failures = sum(1 for t in self.tracks.values() if t.has_signal_failure)
        signal_risk = signal_failures * 0.1

        # Factor in delays
        delayed_trains = sum(1 for t in self.trains.values() if t.status == TrainStatus.DELAYED)
        delay_risk = delayed_trains * 0.05

        return min(1.0, base_risk + closure_risk + signal_risk + delay_risk)

    def get_active_incidents(self) -> int:
        """Count active incidents."""
        count = 0
        count += sum(1 for t in self.tracks.values() if t.has_signal_failure)
        count += sum(1 for p in self.platforms.values() if p.is_closed)
        count += sum(1 for t in self.trains.values() if t.status == TrainStatus.DELAYED)
        count += sum(1 for p in self.platforms.values() if p.state in (PlatformState.WARNING, PlatformState.CRITICAL))
        return count

    # === Crisis scenario methods ===

    def trigger_signal_failure(self, track_id: int):
        track = self.tracks.get(track_id)
        if track:
            track.has_signal_failure = True
            self.event_store.append(SimulationEvent(
                type=EventType.SIGNAL_FAILURE,
                timestamp=time.time(),
                tick=self.tick,
                severity="HIGH",
                message=f"Signal failure detected on Track {track_id}",
                metadata={"trackId": track_id},
            ))

    def trigger_train_delay(self, train_id: str, delay_minutes: float):
        train = self.trains.get(train_id)
        if train:
            train.status = TrainStatus.DELAYED
            train.delay_minutes = delay_minutes
            self.event_store.append(SimulationEvent(
                type=EventType.TRAIN_DELAYED,
                timestamp=time.time(),
                tick=self.tick,
                severity="MEDIUM",
                message=f"{train.name} delayed by {delay_minutes:.0f} minutes",
                metadata={"trainId": train_id, "delayMinutes": delay_minutes},
            ))

    def trigger_platform_closure(self, platform_id: int, reason: str = "maintenance"):
        platform = self.platforms.get(platform_id)
        if platform:
            platform.is_closed = True
            platform.state = PlatformState.CLOSED
            self.event_store.append(SimulationEvent(
                type=EventType.PLATFORM_CLOSED,
                timestamp=time.time(),
                tick=self.tick,
                severity="HIGH",
                message=f"{platform.name} closed: {reason}",
                metadata={"platformId": platform_id, "reason": reason},
            ))

    def surge_passengers(self, platform_id: int, count: int):
        """Add a surge of passengers to a platform."""
        platform = self.platforms.get(platform_id)
        if platform:
            platform.passenger_count += count
            platform.current_density = platform.density_ratio()

    def begin_mitigation(self, platform_id: int):
        platform = self.platforms.get(platform_id)
        if platform:
            platform.state = PlatformState.MITIGATING

    def drain_passengers(self, platform_id: int, rate: int = 20):
        """Actively drain passengers from a platform (intervention effect)."""
        platform = self.platforms.get(platform_id)
        if platform:
            platform.passenger_count = max(0, platform.passenger_count - rate)
            platform.current_density = platform.density_ratio()

    def reopen_platform(self, platform_id: int):
        platform = self.platforms.get(platform_id)
        if platform:
            platform.is_closed = False
            self.event_store.append(SimulationEvent(
                type=EventType.PLATFORM_REOPENED,
                timestamp=time.time(),
                tick=self.tick,
                severity="INFO",
                message=f"{platform.name} reopened",
                metadata={"platformId": platform_id},
            ))

    def restore_signal(self, track_id: int):
        track = self.tracks.get(track_id)
        if track:
            track.has_signal_failure = False
            self.event_store.append(SimulationEvent(
                type=EventType.SIGNAL_RESTORED,
                timestamp=time.time(),
                tick=self.tick,
                severity="INFO",
                message=f"Signal restored on Track {track_id}",
                metadata={"trackId": track_id},
            ))

    def release_train(self, train_id: str):
        train = self.trains.get(train_id)
        if train:
            train.status = TrainStatus.DEPARTING
            train.delay_minutes = 0
            self.event_store.append(SimulationEvent(
                type=EventType.TRAIN_RELEASED,
                timestamp=time.time(),
                tick=self.tick,
                severity="INFO",
                message=f"{train.name} released",
                metadata={"trainId": train_id},
            ))
