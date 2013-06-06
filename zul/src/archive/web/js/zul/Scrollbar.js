/* Scrollbar.js

	Purpose:
	
	Description:	
		A scrollbar used for mesh element	
	History:
		Thu, May 23, 2013 4:44:22 PM, Created by vincentjian

Copyright (C) 2013 Potix Corporation. All Rights Reserved.

*/
(function (zk) {
	var pressTimer;
	function _showScrollbar(wgt, opacity) {
		var hbar = wgt.$n('hor'),
			vbar = wgt.$n('ver');
		if (hbar)
			hbar.style.opacity = opacity;
		if (vbar)
			vbar.style.opacity = opacity;
	};
	function _setScrollPos(position, min, max) {
		if (min > max)
			return position;
		if (position < min)
			position = min;
		if (position > max)
			position = max;
		return position;
	};
/**
 * A Scrollbar used to replace browser native scrollbar on Mesh Element to 
 * navigate the content, such as Grid/Listbox/Tree.
 */
zul.Scrollbar = zk.$extends(zk.Object, {
	/** The container object for this scrolling that user can scroll the whole content
	 * @type DOMElement
	 */
	//cave: null,
	/** The content inside container object that will be scrolled.
	 * @type DOMElement
	 */
	//scroller: null,
	/**
	 * The opts of this scrollbar controls.
	 * 
	 * <h4>embed</h4>
	 * boolean embed
	 * <p>Embed the scrollbar inside container or not.
	 * <p>Default: false
	 * 
	 * <h4>step</h4>
	 * int step
	 * <p>Specifies scrolling pixels each time click on scroll-bar arrow.
	 * <p>Default: 20
	 * 
	 * <h4>wheelAmountStep</h4>
	 * int wheelAmountStep
	 * <p>Specifies the multiple of step when mouse wheel scrolling.
	 * <p>Default: 3
	 * 
	 * @type Map
	 */
	//opts: null,
	_pos: null,
	_barPos: null,
	$n: function (id) {
		return jq(this.uid + '-' + id, zk)[0];
	},
	$init: function (cave, scroller, opts) {
		if (!cave || !scroller)
			throw "Both wrapper and scroller dom element are required to generate scrollbar";
		//define cave container style to hide native browser scroll-bar
		this.cave = cave;
		var cs = cave.style;
		cs.position = 'relative';
		cs.overflow = 'hidden';
		//scrolling content
		this.scroller = scroller;
		//default options
		this.opts = zk.$default(opts, {
			embed: false,
			step: 20, //scrolling pixels
			wheelAmountStep: 3 //wheel amount of step
		});
		this.widget = zk.Widget.$(cave);
		this.uid = this.widget.uuid;
		this._checkBarRequired();
		//initialize scroll-bar position
		this._pos = [0, 0];
		this._barPos = [0, 0];
		this.currentPos = {x: this._pos[0], y: this._pos[1]};
		//bind mouse enter / mouse leave
		if (!opts.embed)
			jq(cave)
				.bind('mouseenter', this.proxy(this._mouseEnter))
				.bind('mouseleave', this.proxy(this._mouseLeave));
	},
	destroy: function () {
		//unbind mouse enter / mouse leave
		if (!this.opts.embed)
			jq(this.cave)
				.unbind('mouseenter', this.proxy(this._mouseEnter))
				.unbind('mouseleave', this.proxy(this._mouseLeave));
		this._unbindMouseEvent('hor');
		this._unbindMouseEvent('ver');
		jq(this.$n('hor')).remove();
		jq(this.$n('ver')).remove();
		this._pos = this._barPos = this.currentPos = null;
	},
	syncSize: function (showScrollbar) {
		this._checkBarRequired();
		
		var wgt = this.widget,
			tpad = wgt.$n('tpad'),
			bpad = wgt.$n('bpad'),
			cave = this.cave,
			scroller = this.scroller,
			hwrapper = this.$n('hor-wrapper'),
			vwrapper = this.$n('ver-wrapper'),
			scrollHeight = scroller.offsetHeight;
		
		if (tpad && bpad) //for Mesh Widget rod
			scrollHeight += tpad.offsetHeight + bpad.offsetHeight;
		
		if (this.needH || this.needV) {
			scroller.style[zk.vendor + 'TransformOrigin'] = '0 0';
			if (this.opts.embed) {
				var cs = cave.style,
					paddingB = hwrapper ? hwrapper.offsetHeight : 0,
					paddingR = vwrapper ? vwrapper.offsetWidth : 0;
				cs.paddingBottom = jq.px(paddingB);
				cs.paddingRight = jq.px(paddingR);
			}
		}
		
		if (this.needH) {
			var left = this.$n('hor-left'),
				right = this.$n('hor-right'),
				ind = this.$n('hor-indicator'),
				hws = hwrapper.style,
				wdh = cave.offsetWidth,
				swdh = scroller.offsetWidth + zk(cave).paddingWidth(),
				rwdh = right.offsetWidth,
				hwdh = wdh - left.offsetWidth - rwdh;
			
			if (this.needV) {
				hws.width = jq.px(hwdh - rwdh);
				right.style.right = jq.px(rwdh);
			} else {
				hws.width = jq.px(hwdh);
			}
			
			var wwdh = hwrapper.offsetWidth,
				iwdh = Math.round(wwdh * wdh / swdh);
			
			ind.style.width = jq.px(iwdh > 8 ? iwdh : 8);
			//sync scroller position limit
			this.hLimit = wdh - swdh;
			//sync scroll-bar indicator position limit
			this.hBarLimit = wwdh - ind.offsetWidth;
			//sync indicator/scroller width ratio
			this.hRatio = Math.abs(this.hLimit / this.hBarLimit);
			//sync bar position
			this._syncBarPosition('hor', this._barPos[0]);
		}
		if (this.needV) {
			var up = this.$n('ver-up'),
				down = this.$n('ver-down'),
				ind = this.$n('ver-indicator'),
				vws = vwrapper.style,
				hgh = cave.offsetHeight,
				shgh = scrollHeight + zk(cave).paddingHeight(),
				dhgh = down.offsetHeight,
				vhgh = hgh - up.offsetHeight - dhgh;
			
			if (this.needH) {
				vws.height = jq.px(vhgh - dhgh);
				down.style.bottom = jq.px(dhgh);
			} else {
				vws.height = jq.px(vhgh);
			}
			
			var whgh = vwrapper.offsetHeight,
				ihgh = Math.round(whgh * hgh / shgh);
			
			ind.style.height = jq.px(ihgh > 8 ? ihgh : 8);
			//sync scroller position limit
			this.vLimit = hgh - shgh;
			//sync scroll-bar indicator position limit
			this.vBarLimit = whgh - ind.offsetHeight;
			//sync indicator/scroller width ratio
			this.vRatio = Math.abs(this.vLimit / this.vBarLimit);
			//sync bar position
			this._syncBarPosition('ver', this._barPos[1]);
		}
		if (showScrollbar)
			_showScrollbar(this, 0.8);
	},
	scrollTo: function (x, y) {
		if (this.needH) {
			x = _setScrollPos(x, this.hLimit, 0);
			this._syncPosition('hor', x);
			this._syncBarPosition('hor', -x / this.hRatio);
		}
		if (this.needV) {
			y = _setScrollPos(y, this.vLimit, 0);
			this._syncPosition('ver', y);
			this._syncBarPosition('ver', -y / this.vRatio);
		}
		var onScrollEnd = this.opts.onScrollEnd;
		if (onScrollEnd) {
			this.currentPos = {x: this._pos[0], y: this._pos[1]};
			onScrollEnd.call(this);
		}
	},
	scrollToElement: function (dom) {
		if (!this.needV)
			return; //no vertical scrollbar
		
		var cave = this.cave,
			domTop = jq(dom).offset().top,
			domBottom = domTop + dom.offsetHeight,
			viewTop = jq(cave).offset().top,
			viewBottom = viewTop + cave.offsetHeight,
			scrollUp = true;
		
		if (domBottom <= viewBottom && domTop >= viewTop)
			return; //already in the view port
		
		if (domTop < viewTop)
			scrollUp = false;
		
		//calculate scrolling movement
		var movement = scrollUp ? domBottom - viewBottom : viewTop - domTop,
			pos = this._pos[1] + (scrollUp ? -movement : movement);
		
		//set and check if exceed scrolling limit
		pos = _setScrollPos(pos, this.vLimit, 0);
		//sync scroll position
		this._syncPosition('ver', pos);
		this._syncBarPosition('ver', -pos / this.vRatio);
		//onScrollEnd callback
		this._onScrollEnd();
		
	},
	getCurrentPosition: function () {
		return this.currentPos;
	},
	_checkBarRequired: function () {
		var cave = this.cave,
			scroller = this.scroller;
		//check if horizontal scroll-bar required
		this.needH = cave.offsetWidth < scroller.offsetWidth;
		if (!this.needH) {
			this._unbindMouseEvent('hor');
			this._syncPosition('hor', 0);
			jq(this.$n('hor')).remove();
		} else {
			if (!this.$n('hor')) {
				this.redraw(cave, 'hor');
				this._bindMouseEvent('hor');
			}
		}
		//check if vertical scroll-bar required
		this.needV = cave.offsetHeight < scroller.offsetHeight;
		if (!this.needV) {
			this._unbindMouseEvent('ver');
			this._syncPosition('ver', 0);
			jq(this.$n('ver')).remove();
		} else {
			if (!this.$n('ver')) {
				this.redraw(cave, 'ver');
				this._bindMouseEvent('ver');
			}
		}
	},
	_bindMouseEvent: function (orient) {
		var self = this,
			cave = self.cave,
			isH = orient == 'hor',
			bar = self.$n(orient),
			ind = self.$n(orient + '-indicator'),
			rail = self.$n(orient + '-rail'),
			arrow1 = self.$n(orient + (isH ? '-left' : '-up')),
			arrow2 = self.$n(orient + (isH ? '-right' : '-down'));
		
		if (isH && (!zk.ie || !zk.opera)) //IE and Opera does not support mouse wheel
			jq(cave).mousewheel(self.proxy(self._mousewheelX));
		else
			jq(cave).mousewheel(self.proxy(self._mousewheelY));
		
		jq(bar).click(zk.$void);
		jq(ind).bind('mousedown', self.proxy(self._dragStart));
		jq(rail)
			.bind('mousedown', self.proxy(self._mouseDown))
			.bind('mouseup', self.proxy(self._mouseUp));
		jq(arrow1)
			.bind('mousedown', self.proxy(self._mouseDown))
			.bind('mouseup', self.proxy(self._mouseUp));
		jq(arrow2)
			.bind('mousedown', self.proxy(self._mouseDown))
			.bind('mouseup', self.proxy(self._mouseUp));
	},
	_unbindMouseEvent: function (orient) {
		var self = this,
			cave = self.cave,
			isH = orient == 'hor',
			bar = self.$n(orient),
			ind = self.$n(orient + '-indicator'),
			rail = self.$n(orient + '-rail'),
			arrow1 = self.$n(orient + (isH ? '-left' : '-up')),
			arrow2 = self.$n(orient + (isH ? '-right' : '-down'));
		
		if (isH && (!zk.ie || !zk.opera)) //IE and Opera does not support mouse wheel
			jq(cave).unmousewheel(self.proxy(self._mousewheelX));
		else
			jq(cave).unmousewheel(self.proxy(self._mousewheelY));
		
		jq(bar).unbind('click', zk.$void);
		jq(ind).unbind('mousedown', self.proxy(self._dragStart));
		jq(rail)
			.unbind('mousedown', self.proxy(self._mouseDown))
			.unbind('mouseup', self.proxy(self._mouseUp));
		jq(arrow1)
			.unbind('mousedown', self.proxy(self._mouseDown))
			.unbind('mouseup', self.proxy(self._mouseUp));
		jq(arrow2)
			.unbind('mousedown', self.proxy(self._mouseDown))
			.unbind('mouseup', self.proxy(self._mouseUp));
	},
	_mouseEnter: function (evt) {
		_showScrollbar(this, 0.8);
	},
	_mouseLeave: function (evt) {
		if (this.dragging)
			return;
		
		_showScrollbar(this, 0);
	},
	_dragStart: function (evt) {
		evt.preventDefault();
		var self = this,
			orient = self.$n('hor-indicator') == evt.currentTarget ? 'hor' : 'ver',
			isHor = orient == 'hor',
			point = isHor ? evt.pageX : evt.pageY,
			pos = isHor ? self._barPos[0] : self._barPos[1],
			data = {
				orient: orient,
				point: point,
				pos: pos
			};
		
		jq(document)
			.bind('mousemove', data, self.proxy(self._dragMove))
			.bind('mouseup', self.proxy(self._dragEnd));
	},
	_dragEnd: function (evt) {
		var self = this,
			x = evt.pageX,
			y = evt.pageY,
			cave = self.cave,
			offset = jq(cave).offset().left;
		
		jq(document)
			.unbind('mousemove', self.proxy(self._dragMove))
			.unbind('mouseup', self.proxy(self._dragEnd));
		
		self.dragging = false;
		if (!self.opts.embed && (x < offset || x > offset + cave.offsetWidth))
			_showScrollbar(self, 0);
		//onScrollEnd callback
		self._onScrollEnd();
	},
	_dragMove: function (evt) {
		var data = evt.data,
			orient = data.orient,
			point = data.point,
			pos = data.pos,
			isHor = orient == 'hor',
			disp = (isHor ? evt.pageX : evt.pageY) - point,
			barPos = pos + disp,
			limit = isHor ? this.hBarLimit : this.vBarLimit,
			ratio = isHor ? this.hRatio : this.vRatio;
		
		this.dragging = true;
		
		//set and check if exceed scrolling limit
		barPos = _setScrollPos(barPos, 0, limit);
		//sync position
		this._syncBarPosition(orient, barPos);
		this._syncPosition(orient, -barPos * ratio);
	},
	_mousewheelX: function (evt, delta, deltaX, deltaY) {
		var opts = this.opts,
			step = opts.step * opts.wheelAmountStep,
			pos = this._pos[0];
		
		if (deltaX) {
			evt.stop();
			//left: step, right: -step
			pos += (deltaX > 0 ? step : -step);
			//set and check if exceed scrolling limit
			pos = _setScrollPos(pos + step, this.hLimit, 0);
			//sync position
			this._syncPosition('hor', pos);
			this._syncBarPosition('hor', -pos / this.hRatio);
			//onScrollEnd callback
			this._onScrollEnd();
		}
	},
	_mousewheelY: function (evt, delta, deltaX, deltaY) {
		var opts = this.opts,
			step = opts.step * opts.wheelAmountStep,
			pos = this._pos[1];
		
		if (deltaY) {
			evt.stop();
			//up: step, down: -step
			pos += (deltaY > 0 ? step : -step);
			//set and check if exceed scrolling limit
			pos = _setScrollPos(pos, this.vLimit, 0);
			//sync position
			this._syncPosition('ver', pos);
			this._syncBarPosition('ver', -pos / this.vRatio);
			//onScrollEnd callback
			this._onScrollEnd();
		}
	},
	_mouseUp: function (evt) {
		clearInterval(pressTimer);
		this._onScrollEnd();
	},
	_mouseDown: function (evt) {
		var target = evt.currentTarget,
			hRail = this.$n('hor-rail'),
			vRail = this.$n('ver-rail'),
			up = this.$n('ver-up'),
			down = this.$n('ver-down'),
			left = this.$n('hor-left'),
			right = this.$n('hor-right');
		
		//click on rail
		if (target == hRail || target == vRail) {
			var isHor = target == hRail,
				orient = isHor ? 'hor' : 'ver',
				point = isHor ? evt.pageX : evt.pageY,
				offset = jq(target).offset(),
				offset = isHor ? offset.left : offset.top,
				ind = this.$n(isHor ? 'hor-indicator' : 'ver-indicator'),
				indsz = isHor ? ind.offsetWidth : ind.offsetHeight,
				limit = isHor ? this.hBarLimit : this.vBarLimit,
				ratio = isHor ? this.hRatio : this.vRatio;
				barPos = point - offset - indsz/2;
			
			//set and check if exceed scrolling limit
			barPos = _setScrollPos(barPos, 0, limit);
			//sync position
			this._syncBarPosition(orient, barPos);
			this._syncPosition(orient, -barPos * ratio);
		}
		//click on arrows
		if (target == left || target == right || target == up || target == down) {
			var self = this,
				isHor = target == left || target == right,
				orient = isHor ? 'hor' : 'ver',
				step = self.opts.step,
				limit = isHor ? self.hLimit : self.vLimit,
				ratio = isHor ? self.hRatio : self.vRatio,
				pos = isHor ? this._pos[0] : this._pos[1];
			//setInterval for long press on arrow button
			pressTimer = setInterval(function () {
				//horizontal scroll
				if (isHor) //left: step, right: -step
					pos += (target == left ? step : -step);
				else //up: step, down: -step
					pos += (target == up ? step : -step);
				//set and check if exceed scrolling limit
				pos = _setScrollPos(pos, limit, 0);
				//sync position
				self._syncPosition(orient, pos);
				self._syncBarPosition(orient, -pos / ratio);
			}, 50);
		}
	},
	_syncPosition: function (orient, pos) {
		if (!this._pos)
			return;
		
		if (orient == 'hor')
			this._pos[0] = pos;
		if (orient == 'ver')
			this._pos[1] = pos;
		
		//onSyncPosition callback
		var onSyncPosition = this.opts.onSyncPosition;
		if (onSyncPosition) {
			this.currentPos = {x: this._pos[0], y: this._pos[1]};
			onSyncPosition.call(this);
		}
		
		this.scroller.style[zk.vendor + 'Transform'] = 
			'translate(' + this._pos[0] + 'px, ' + this._pos[1] + 'px)';
	},
	_syncBarPosition: function (orient, pos) {
		if (orient == 'hor') {
			this._barPos[0] = pos;
			this.$n('hor-indicator').style[zk.vendor + 'Transform'] = 
				'translate(' + this._barPos[0] + 'px, 0)';
		}
		if (orient == 'ver') {
			this._barPos[1] = pos;
			this.$n('ver-indicator').style[zk.vendor + 'Transform'] = 
				'translate(0, ' + this._barPos[1] + 'px)';
		}
	},
	_onScrollEnd: function () {
		var onScrollEnd = this.opts.onScrollEnd;
		if (onScrollEnd) {
			this.currentPos = {x: this._pos[0], y: this._pos[1]};
			onScrollEnd.call(this);
		}
	},
	redraw: function (cave, orient) {
		var ecls = this.opts.embed ? 'z-scrollbar-embed ' : '',
			isH = orient == 'hor',
			uid = this.uid + '-' + orient,
			hv = isH ? 'horizontal' : 'vertical',
			lu = isH ? 'left' : 'up',
			rd = isH ? 'right' : 'down',
			out = [];
		
		out.push(
		'<div id="', uid, '" class="z-scrollbar ', ecls, 'z-scrollbar-', hv, '">',
			'<div id="', uid, '-', lu, '" class="z-scrollbar-', lu, '">',
				'<i class="z-scrollbar-icon z-icon-arrow-', lu, '"></i>',
			'</div>',
			'<div id="', uid,'-wrapper" class="z-scrollbar-wrapper">',
				'<div id="', uid,'-indicator" class="z-scrollbar-indicator"></div>',
				'<div id="', uid,'-rail" class="z-scrollbar-rail"></div>',
			'</div>',
			'<div id="', uid, '-', rd, '" class="z-scrollbar-', rd, '">',
				'<i class="z-scrollbar-icon z-icon-arrow-', rd, '"></i>',
			'</div>',
		'</div>');
		jq(cave).append(out.join(''));
		out = null;
	}
});
})(zk);