# Project Space Couch

## Running

```
git clone https://github.com/Nebual/space-couch.git
cd space-couch
yarn install
yarn start
```
Then connect to http://[lan-ip-here]:3000/ from your phones

#### Optimized Static Build
```
yarn build
yarn serve
```

#### Split dev terminals
```
yarn watch:client # Webpack output
yarn watch:server:tsc # Server recompiling output
yarn watch:server:express # Server runtime window
```

## Troubleshooting

###Can't connect
* Firewall? Open port 8000

###Game isn't fun
* Yeah its kinda early

###~~There's no stars~~ The stars don't move, this isn't space at all
* Working on it

## Design Principles
* Require cross-role coordination
* Encourage tunnel-vision
  * Each role has its own narrow focus, and isn't given sufficient information to 
  correctly make decisions without information from other roles (or the captain)
* Roles should all have small amounts of downtime

## Todo
* Backend
  * [X] Saves/restores client state between refreshes/disconnects
  * [X] Saves/restores server state between server reboots/crashes
* Engineer
  * [X] Many swipe-navigable panels, categorized
  * A ton of widgets, including:
    * [X] Sliders
    * [X] Gauges
    * [ ] Dials
    * [ ] Knobs
    * [X] Buttons
  * Max Watts (capacity) sliders for subsystems
  * Max Volts (strength) sliders for subsystems
  * Everything is poorly labeled - can vary according to the Model # of the module (which changes when upgraded, and each game start will have different default models)
    * Protogen's Thor Sublight Thrusters have a 'T Inhibitor' (inverse max capacity) and a 'T Coefficient' (voltage) sliders,
    * Far Horizon's Calibrus Thrusters use a pair of 'T Cap A' and 'T Cap B' max capcity sliders, B must stay below A but are otherwise added together, along with a 'T Vlt' (voltage) slider
  * Has to manage temperature of the reactor core
    * Barotrauma has Fission Rate (control rods -> heat production) + Turbine Output (heat consumption -> energy output)
    which must be balanced https://barotrauma.gamepedia.com/Nuclear_Reactor#Usage possibly with varying types of fuel rods
  * Temperature of individual components - indicates how overworked they are
  * Overall Ship temperature is reduced via deployed radiators,
    which can be damaged if mid-combat, must be retracted before jumping,
    and are more efficient with shields down
  * Life Support is a power lever - if left unpowered, vision blurs for everyone and/or ice crystals form
* Robotics Expert
  * [X] Needs a map of the ship
  * [X] Directs robots over it to do things that need movement
  * [X] Fire extinguishing
  * [X] Repair
    * [X] With spare part - slower, consumes part
    * [X] With duct tape - faster, drops efficiency of system
  * [X] Rerouting power lines, changing power conduits
  * [X] Move sensors, shield emitters, guns, ammo storage, etc around the ship
  * Counter Intrusion
  * Has FTL styles sensors, if they're offline, only rooms with robots in them are viewable
  * Other roles have a 'check engine light', which can be a 3 second fix for the RE, or its just nothing
  * ship design? https://opengameart.org/content/modular-spaceships
* Pilot?
  * Has local area map (in maneuverability thruster mode)
  * ~~Has system map (in sublight mode)~~ 
  Or maybe navigation has the system map, and can add waypoints for the pilot
  * Has to set the heading for Jumps
  * Turns via spinning giant wooden steering wheel
  * Has giant throttle lever, or https://img1.etsystatic.com/000/0/6355253/il_fullxfull.340992455.jpg
  * http://nebtown.info/ss/neb/2019_12_18_19-56-23.png
  * http://nebtown.info/ss/neb/2019_12_18_19-56-41.png
  * Top-down view (eg. Sunless Skies); 'drifting forward' at 100% speed (10km/s? 'legal speed'?), but can use
  thrusters to accel faster/slower/left/right relative to other objects
  (asteroids, debris fields, other ships) in the plane/route.
    * steering wheel/throttle for controls
    * top-down allows seeing and avoiding obstacles from all directions, which improves
    positional damage (debris hitting right shields), unusual flight models (eg. primary thrusters are down, so move entirely via strafe)
  * Alternatively Kart view: allows seeing further ahead, but means only "the front" of ship is interesting

* Navigation
  * 3D gyroscoped panoramic parallax view of space, including constellations
  * Reuses Weapons's view - but while Weapons ignore the stars to focus on the foreground,
  Nav looks past the ships and planets to analyze the backdrop
  * To find where you are, you have to match visible constellations 
  with a database of known ones
    * Option a: Match against db of "Big Dipper is visible from 8 systems, 
    Cancer is visible from another 7, but both are only visible from 3, 
    that kinda looks like Leo, which would make it the Xenu system, unless
    that's the other constellation, in which case its the Abott system.
    Going with Xenu. Probably.
    * Have the same parallax stars view as Weapons
    * Have an overlayed list of constellations you can tick off upon finding them,
    which automatically narrows down the list of systems it could be. 
    List shows tiny thumbnails, can tap them to zoom in on a big picture of the constellation.
  * To find where you're going, you need a bearing...
  * Calculates the distance... math/pattern thing?
* Science (may merge into Navigation)
  * Analyzes ships that jump into radar range
    * Can mark as friend/foe, classify (size? capabilities? weapon types?)
    * Longer scans/different equipment reveals different characteristics (thrust signature, reactor radiation, shielding methods)
    which hint at ship identity
  * Creates/improves maps (for uncharted systems)
    * Scan anomalies/planets/etc, Elite/EvE probe minigames
  * Collects KSP-like science (earns money)
* Radar
  * Single-sensor 360 view radar charts (eg. temperature in all directions)
  * Multi-sensor radar charts aimed in a cone (point sensor array forward: tachyons + sin waving EM? Must be Klingons warping in)
  https://www.visualcinnamon.com/2015/10/different-look-d3-radar-chart.html
  * Can inform Weapons of enemy ships (potentially types)
  * Can inform Communications of tightbeam direction channel
  * Can inform ship of anomalies, science, mission criteria
  * Asthetic: CRT with big buttons on the sides, including a degauss effect upon switching
  https://en.wikipedia.org/wiki/File:Space_Rocks_(game).jpg
* Weapons
  * Reticle minigame
	  * [X] Stars background
	  * [X] Parallax stars background according to gyro movement
  * Swipe to switch to different views (different gun mount points)
  * The only Role to think of space as full 3d sphere space (most are just a 2d plane)
  * Torpedo configuration minigame:
    * configure seeking method (dumb, heat, EM, etc)
    * delay before thrusting (for silent running)
    * delay before seeking starts (so it doesn't target YOU)
    * delay before triggering
    * dial in heading + fire
    * variable payload
      * scientific probe
      * comms probe (can be tightbeamed to, as a relay)
      * crybaby
      * boom
    * variable payload "strength"
* Shields (probably handled by Weapons)
  * Have an energy buffer, depletes over time, used up upon absorbing hits
  * Can be disengaged/enabled quite quickly while the buffer is full - slower the lower it is
  * Combat
    * Can be toggled off between enemy shots, if attack patterns are predictable
  * Noncombat:
    * Asteroids
    * While in Warp
    * Radiation
  * Shield Emitters are in specific locations around the ship,
  emit a field that surrounds it but is more efficient closer to the emitter,
  so if the Port emitter goes down, the other ones can compensate inefficiently
* Communications
  * Can hail ships/stations and attempt to parlay
  * Often challenging due to cultural/language barriers (Shaka, when the walls fell)
  * Codex/Reference Book detailing cultural practices and how to best navigate them
  * Broadbeam = no aiming, really loud EM. Narrowbeam = rough aiming, quiet EM. Tightbeam = tight aiming, silent EM.
* Captain
  * Mission details
  * Has inventory of spare parts
  * Red Alert button
  * Has the JUMP button
  * Rubber stamp certain actions (eg. illegal weapons, overriding safeties) via popup prompts
* Overview Screen (TV)
  * Shows vague stats about the ship, just a very high level "this system is unpowered/overpowered/damaged"
  * Mission countdown clock
  * Displays alerts
    * damage taken
    * Missiles locked
    * Red Alert (set by Captain)
    * Systems offline
    * New ship detected on radar
    * "Mission Complete"
* Plot
  * Red Line?
  * The mission is a race (across a system, between planets, between 2-3 systems)
  * There are pit stops for repairs/upgrades/component swaps
