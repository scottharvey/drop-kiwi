$(function() {
  
  function Player() {
    this.x = $(window).width() / 2;
    this.y = -200;
    this.sprite = playerSprite = $('.player');
    this.lastMoved = new Date();
  }

  Player.prototype.draw = function() {
    this.sprite.css({
      left: this.x,
      top: this.y
    })    
  }

  Player.prototype.start = function() {
    this.y = 200;
    this.sprite.animate({ top: 200, left: $(window).width() / 2 }, 4000);
  }

  Player.prototype.keyMove = function(event) {
    console.debug(event.which);
    switch(event.which) {
      case 37:
        if (this.x > 0) { this.x -= 10 }
        break;
      case 39:
        if (this.x < $(window).width() - this.sprite.width()) { this.x += 10 }
        break;
      case 40:
        if (this.y < $(window).height() - this.sprite.height()) { this.y += 10 }
        break;
      case 38:
        if (this.y > 0) { this.y -= 7 }
        break;
    }
    this.draw();
  }

  Player.prototype.move = function(event) {
    var horizontalMax = $(window).width() - this.sprite.width();
    var verticalMax = $(window).height() - this.sprite.height();
    if ((this.x + event.gamma * 2) > 0 && (this.x + event.gamma * 2) < horizontalMax) {
      this.x += event.gamma * 2;
    }
    if ((this.y + event.beta * 2) > 0 && (this.y + event.beta * 2) < verticalMax) {
      this.y += event.beta * 2;
    }
    this.draw();
  }

  function Enemy(type, key) {
    var percent = Math.round(Math.random() * 100);
    this.sprite = enemySprite = $("<div class='enemy type_"+type+"'></div>"); 
    if (type == 1) {
      enemySprite.css({ left: percent + '%', top: -600 });
    } else {
      if (percent <= 50) {
        enemySprite.css({ left: -600, top: percent + '%' });
      } else {
        enemySprite.css({ left: $(window).width() + 500, top: percent + '%' });
      }
    }

    $('body').append(this.sprite);
    setTimeout(function() {
      if (type == 1) {
        enemySprite.css({ left: percent + '%', top: $(window).height() + 600 });
      } else {
        if (percent <= 50) {
          enemySprite.css({ left: $(window).width() + 500, top: percent + '%' });
        } else {
          enemySprite.css({ left: -600, top: percent + '%' });
        }
      }
    }, 200);
    setTimeout(function() { delete game.enemies[key]; }, 4000);
  }

  function Cloud(size, key) {
    this.sprite = sprite = $("<div class='cloud size_"+size+"'></div>"); 
    this.sprite.css({
      left: Math.round(Math.random() * 100) + '%',
      top: $(window).height() + 800
    })
    $('body').append(this.sprite);
    setTimeout(function() { sprite.css({ top: -600 }); }, 200);
    setTimeout(function() { delete game.enemies[key]; }, 4000);
  }


  function Game() {
  }

  Game.prototype.start = function() {
    this.started = true;
    this.score = 0;
    this.speed = 50;

    this.player = new Player();
    this.player.start();

    this.enemies = {};
    this.enemyCount = 0;
    this.enemyFrequency = 0.92;

    this.clouds = {};
    this.cloudCount = 0;
    this.cloudFrequency = 0.8;

    window.addEventListener('deviceorientation', $.proxy(this.player.move, this.player), false);
    $(window).keydown($.proxy(this.player.keyMove, this.player));

    this.gameLoop = setInterval($.proxy(this.tick, this), this.speed);
    setTimeout($.proxy(function() {
      this.generateLoop = setInterval($.proxy(this.generate, this), 50);
    }, this), 5000);
  }

  Game.prototype.generate = function() {
    var random = Math.random(),
        percent = Math.round(Math.random() * 100);
    
    // Randomly create new enemies
    if (random > this.enemyFrequency) {
      var type;
      if (percent <= 25) {
        type = 1;
      } else if (percent <= 50) {
        type = 2;
      } else if (percent <= 75) {
        type = 3;
      } else {
        type = 4;
      }
      this.enemyCount ++;
      this.enemies[this.enemyCount] = new Enemy(type, this.enemyCount);
    }
    
    // Randomly create new clouds
    if (random > this.cloudFrequency) {
      var size;
      if (percent <= 25) {
        size = 1;
      } else if (percent <= 50) {
        size = 2;
      } else if (percent <= 75) {
        size = 3;
      } else {
        size = 4;
      }
      this.cloudCount ++;
      this.clouds[this.cloudCount] = new Cloud(size, this.cloudCount);
    }
  }

  Game.prototype.jump = function() {
  }

  Game.prototype.tick = function() {
    // Check for collisions
    var playerOffsets = this.player.sprite.offset(),
        playerLeft = playerOffsets.left,
        playerTop = playerOffsets.top,
        playerRight = playerLeft + this.player.sprite.width(),
        playerBottom = playerTop + this.player.sprite.height();

    for (key in this.enemies) {
      var enemy = this.enemies[key],
          sprite = enemy.sprite,
          offsets = sprite.offset(),
          left = offsets.left,
          top = offsets.top,
          right = left + sprite.width(),
          bottom = top + sprite.height();

      if ((left >= playerLeft && left <= playerRight && top >= playerTop && top <= playerBottom) ||
          (left >= playerLeft && left <= playerRight && bottom >= playerTop && bottom <= playerBottom) ||
          (right >= playerLeft && right <= playerRight && top >= playerTop && top <= playerBottom) ||
          (right >= playerLeft && right <= playerRight && bottom >= playerTop && bottom <= playerBottom)) {

        clearInterval(this.gameLoop);
        clearInterval(this.generateLoop);
        var splat = $("<div id='splat'><p>"+this.score+"</p><a href='' id='restart'>jump again?</a></div>"),
             win = $(window);
        splat.css({ top: this.player.sprite.offset().top - 100, left: this.player.sprite.offset().left - 100 });
        this.player.sprite.hide();
        $('body').append(splat);
        $('#restart').click($.proxy(function() {
          window.location.reload();
          return false;
        }, this));
      }
    };
    this.score += 1;
    $('#score').text(this.score);

    // Increase difficulty
    if (this.score == 500 || this.score == 1000 || this.score == 1500) {
      this.enemyFrequency = this.enemyFrequency / 2;
    }

    if (this.score == 500) {
      $('#level').text('Level 2');
    } else if (this.score == 1000) {
      $('#level').text('Level 3');
    } else if (this.score == 1500) {
      $('#level').text('Level 4');
    }
  }

  window.game = new Game();

  $('#jump').click(function() {
    if (!game.started) {
      game.start();
      $('#song').get(0).play();
      $('html').addClass('gotime');
      $('#stars').addClass('gotime');
      $('#intro').addClass('gotime');
    }
    return false;
  });

});
