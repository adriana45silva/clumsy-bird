
var BirdEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = me.loader.getImage('clumsy');
        settings.width = 32;
        settings.height = 32;
        settings.spritewidth = 32;
        settings.spriteheight= 32;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0.2;
        this.gravityForce = 0.01;
        this.maxAngleRotation = Number.prototype.degToRad(30);
        this.maxAngleRotationDown = Number.prototype.degToRad(90);
        this.renderable.addAnimation("flying", [0, 1, 2, 3, 4, 5, 6]);
        this.renderable.addAnimation("idle", [0]);
        this.renderable.setCurrentAnimation("flying");
        this.renderable.anchorPoint = new me.Vector2d(0.1, 0.5);
        // manually add a rectangular collision shape
        this.body.addShape(new me.Rect(5, 5, 70, 50));

        // a tween object for the flying physic effect
        this.flyTween = new me.Tween(this.pos);
        this.flyTween.easing(me.Tween.Easing.Exponential.InOut);

        // end animation tween
        this.endTween = null;

        // collision shape
        this.collided = false;
    },

    update: function(dt) {
        // mechanics

        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        if (me.input.isKeyPressed('fly')) {
            me.audio.play('wing');
            this.gravityForce = 0.01;
            var currentPos = this.pos.y;
            // stop the previous tweens
            this.flyTween.stop();
            this.flyTween.to({y: currentPos - 72}, 50);
            this.flyTween.start();
            this.renderable.angle = -this.maxAngleRotation;
        } else {
            this.gravityForce += 0.2;
            this.pos.y += me.timer.tick * this.gravityForce;
            this.renderable.angle += Number.prototype.degToRad(0.5) * this.gravityForce;
            if (this.renderable.angle > this.maxAngleRotationDown)
                this.renderable.angle = this.maxAngleRotationDown;
        }
        this.updateBounds();

        var hitSky = -80; // bird height + 20px
        if (this.pos.y <= hitSky || this.collided) {
            game.data.start = false;
            me.audio.play("lose");
            this.endAnimation();
            return false;
        }

        me.collision.check(this);
        this._super(me.Entity, 'update', [dt]);
        return true;
    },

    onCollision: function(response) {
        var obj = response.b;
        if (obj.type === 'ground') {
            me.device.vibrate(500);
            this.collided = true;
        } 

        if (obj.type === 'pipe') {
            me.device.vibrate(500);
            this.collided = true; 
        } 

        // remove the hit box
        if (obj.type === 'hit') {
            me.game.world.removeChildNow(obj);
            game.data.steps++;
            me.audio.play('hit');
        }

        if (obj.type === 'power') {
            me.game.world.removeChildNow(obj);
            game.data.power++;
            me.audio.play('lose');
        }
    },

    endAnimation: function() {
        me.game.viewport.fadeOut("#fff", 100);
        var currentPos = this.renderable.pos.y;
        this.endTween = new me.Tween(this.renderable.pos);
        this.endTween.easing(me.Tween.Easing.Exponential.InOut);

        this.flyTween.stop();
        this.renderable.angle = this.maxAngleRotationDown;
        var finalPos = me.video.renderer.getHeight() - this.renderable.width/2 - 96;
        this.endTween
            .to({y: currentPos}, 1000)
            .to({y: finalPos}, 1000)
            .onComplete(function() {
                me.state.change(me.state.GAME_OVER);
            });
        this.endTween.start();
    }

});

/* ==========================================================================
   Pipe Entity
   ========================================================================== */

var PipeEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('pipe');
        settings.width = 148;
        settings.height= 1664;
        settings.spritewidth = 148;
        settings.spriteheight= 1664;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.addShape(new me.Rect(0 ,0, settings.width, settings.height));
        this.body.gravity = 0;
        this.body.vel.set(-5, 0);
        this.type = 'pipe';
    },  

    update: function(dt) {
        // mechanics
        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        this.pos.add(this.body.vel);
        if (this.pos.x < -this.image.width) {
            me.game.world.removeChild(this);
        }
        this.updateBounds();
        this._super(me.Entity, 'update', [dt]);
        return true;
        
    },



});

/* ==========================================================================
   Pipe Generator
   ========================================================================== */

var PipeGenerator = me.Renderable.extend({
    init: function() {
        this._super(me.Renderable, 'init', [0, me.game.viewport.width, me.game.viewport.height]);
        this.alwaysUpdate = true;
        this.generate = 0;
        this.pipeFrequency = 92;
        this.pipeHoleSize = 1240;
        this.posX = me.game.viewport.width;
    },

    onCollision : function (response){
            // res.y >0 means touched by something on the bottom
            // which mean at top position for this one
        if (response.y < - this.image.width){
            this.flicker(45);
        }
    },

    update: function(dt) {
        // console.log("Powerup: " + game.data.power);
        if (this.generate++ % this.pipeFrequency == 0) {
            var posY = Number.prototype.random(
                    me.video.renderer.getHeight() - 100,
                    200
            );
            var posY2 = posY - me.video.renderer.getHeight() - this.pipeHoleSize;
            var pipe1 = new me.pool.pull('pipe', this.posX, posY);
            // var pipe2 = new me.pool.pull('pipe', this.posX, posY2);
            var hitPos = posY - 100;
            var hit = new me.pool.pull("hit", this.posX, hitPos);
            var power = new me.pool.pull('power', 100, 150);
            pipe1.renderable.flipY(true);
            me.game.world.addChild(pipe1,  10);
            // me.game.world.addChild(pipe2, 10);
            me.game.world.addChild(hit, 11);

            if (game.data.steps >= 5) {
                me.game.world.addChild(power, 12);

                if(game.data.power > 1) {
                    pipe1.body.collisionType = me.collision.types.NO_OBJECT;
                    console.log("Now you can't be killed by the pipes: " + pipe1.body.collisionType);
                }

                if (game.data.power > 5) {
                    me.game.world.removeChild(power);
                }
            } 

            if (game.data.steps >=10 ){
                pipe1.body.collisionType = me.collision.types.ENEMY_OBJECT;
                console.log("Now you're fucked " + pipe1.body.collisionType);
            }
        }
        

        this._super(me.Entity, "update", [dt]);
        return true;

    },

});

/* ==========================================================================
   Hit Entity
   ========================================================================== */

var HitEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('hit');
        settings.width = 148;
        settings.height= 60;
        settings.spritewidth = 148;
        settings.spriteheight= 60;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 5;
        this.updateTime = false;
        this.renderable.alpha = 0.5;
        this.body.accel.set(-5, 0);
        this.body.addShape(new me.Rect(0, 0, settings.width, settings.height));
        this.type = 'hit';
    },

    update: function(dt) {
        // mechanics
        this.pos.add(this.body.accel);
        if (this.pos.x < -this.image.width) {
            me.game.world.removeChild(this);
        }
        this.updateBounds();
        this._super(me.Entity, "update", [dt]);
        return true;
    },

});

/* ==========================================================================
    Power Entity
   ========================================================================== */

var PowerEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('hit');
        settings.width = 148;
        settings.height= 60;
        settings.spritewidth = 148;
        settings.spriteheight= 60;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.updateTime = true;
        this.renderable.alpha = 1;
        this.body.accel.set(-3, 0);
        this.body.addShape(new me.Rect(200, 100, settings.width, settings.height));
        this.type = 'power';
    },

    update: function(dt) {
        // mechanics
        this.pos.add(this.body.accel);
        // if (this.pos.x < -this.image.width) {
        //     me.game.world.removeChild(this);
        // }

        this.updateBounds();
        this._super(me.Entity, "update", [dt]);
        return true;
    },

});

/* ==========================================================================
   Ground Entity
   ========================================================================== */

var Ground = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = me.loader.getImage('ground');
        settings.width = 900;
        settings.height= 96;
        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.body.vel.set(-4, 0);
        this.body.addShape(new me.Rect(0 ,0, settings.width, settings.height));
        this.type = 'ground';
    },

    update: function(dt) {
        // mechanics
        this.pos.add(this.body.vel);
        if (this.pos.x < -this.renderable.width) {
            this.pos.x = me.video.renderer.getWidth() - 10;
        }
        this.updateBounds();
        return this._super(me.Entity, 'update', [dt]);
    },

});
