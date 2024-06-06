/*
 * Copyright (c) 2019 YASUOKA Masahiko <yasuoka@yasuoka.net>
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

// mm => point
function pt(mm) {
    return (mm * (72 / 25.4));
}

function shape(doc, x, y) {
    var o = { doc: doc, x: x, y: y }
    o.line = function(x0, y0, x1, y1) {
	this.doc
	    .moveTo(this.x + x0, this.y + y0)
	    .lineTo(this.x + x0 + x1, this.y + y0 + y1);
	return this;
    };
    return o;
}

// horizontal text box
function htext(doc, x, y, width, height) {
    var o = { doc: doc, x: x, x0: x, y: y, width: width, height: height }
    o.text = function(text, opt) {
	var p = [ 1, 1, 1, 1 ];
	if ('padding' in opt) {
	    if (Array.isArray(opt.padding))
		p = opt.padding;
	    else
		p = [ opt.padding, opt.padding, opt.padding, opt.padding ];
	}
	if (!('baseline' in opt))
	    opt.baseline = "middle";
	if ('font' in opt)
	    doc.font(opt.Font);
	if ('fontColor' in opt)
	    doc.fillColor(opt.fontColor);
	else
	    doc.fillColor("#000000");
	if ('fontSize' in opt)
	    doc.fontSize(opt.fontSize);
	var opt0 = {
	    width: opt.width - p[1] - p[3], baseline: opt.baseline,
	    align: opt.align
	};
	doc.text(text,
	    (opt.align === "right")
		? this.x0 + this.width - opt.width - p[3]
		: this.x + p[1],
	    (opt.baseline === "top")
		? this.y + p[0]
		:
	    (opt.baseline === "middle")
		? this.y + p[0] + this.height / 2
		: this.y + this.height - p[2],
	    opt0);
	this.x += opt.width;
	doc.font("Helvetica");
	return o;
    }
    return o;
}

function days_in_month(year, month)
{
    const days= [
	[ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ],
	[ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ]];
    var leapyear = (year <= 1752)? (year % 4) == 0 :
	((year % 4) == 0 && (year % 100) != 0) || (year % 400) == 0;
    return days[leapyear? 1 : 0][month - 1];
}


function addPage(doc, year, month, event_get = null, wdayoff = 0)
{
    var sd = new Date(year, month - 1, 1).getDay();
    var nd = days_in_month(year, month);

    sd = (7 + sd - wdayoff) % 7;
    const pageSize   = [ pt(298), pt(210) ];	// A4 landscape
    const pageMargin = [ pt(5), pt(5), pt(5), pt(5) ]

    const monstrs = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"];

    doc.addPage({size: pageSize, margins: pageMargin});
    const p1 = {
	w: pageSize[0] - pageMargin[1] - pageMargin[3],
	h: pageSize[1] - pageMargin[0] - pageMargin[2] - 20,
	x: pageMargin[3],
	y: pageMargin[0]
    };
    const cy = p1.h / 6;		// calendar y
    const ch = p1.h - cy;		// calendar height
    
    /*
     * 7 x 5 lines
     */
    var s = shape(doc, p1.x, p1.y)
	.line((p1.w / 7) * 1, cy, 0, ch)
	.line((p1.w / 7) * 2, cy, 0, ch)
	.line((p1.w / 7) * 3, cy, 0, ch)
	.line((p1.w / 7) * 4, cy, 0, ch)
	.line((p1.w / 7) * 5, cy, 0, ch)
	.line((p1.w / 7) * 6, cy, 0, ch)
	.line(0, cy + (ch / 5) * 0, p1.w, 0)
	.line(0, cy + (ch / 5) * 1, p1.w, 0)
	.line(0, cy + (ch / 5) * 2, p1.w, 0)
	.line(0, cy + (ch / 5) * 3, p1.w, 0)
	.line(0, cy + (ch / 5) * 4, p1.w, 0)
	.line(0, cy + (ch / 5) * 5, p1.w, 0);
    // line for 6th row
    if (sd + nd > 35)
	s.line(0, cy + (ch / 5) * 4.5, (p1.w / 7) * (sd + nd - 35), 0);
    s.doc.stroke();	// firefox require this

    /*
     * Titles
     */
    htext(doc, p1.x, p1.y, p1.w, cy - 20)
	.text(month, {align: "center", baseline: "middle", padding: 0,
	    width: pt(20), fontSize: 48})
	.text(monstrs[month - 1],
	    {align: "center", baseline: "middle", padding: 0,
	    width: pt(60), fontSize: 24})
	.text(year,
	    {align: "right", baseline: "middle", padding: 0,
	    width: pt(80), fontSize: 48});

    /*
     * Day of week Header
     */
    var wdaytext = function(color = "#000000") {
	return {
	    align: "left", baseline: "bottom", padding: 4, width: p1.w / 7,
	    fontColor: color};
    };
    var wdaylabels = [
	["Sunday", wdaytext("#cc3333")],  ["Monday", wdaytext()],
	["Tuesday", wdaytext()], ["Wednesday", wdaytext()],
	["Thursday", wdaytext()], ["Friday", wdaytext()],
	["Saturday", wdaytext("#3333cc")]];
    // rotate with wdayoff
    for (var i = 0; i < wdayoff; i++)
	wdaylabels.push(wdaylabels.shift());
    // draw
    doc.fontSize(12);
    htext(doc, p1.x, p1.y + cy - 20, p1.w, 20)
	.text(wdaylabels[0][0], wdaylabels[0][1])
	.text(wdaylabels[1][0], wdaylabels[1][1])
	.text(wdaylabels[2][0], wdaylabels[2][1])
	.text(wdaylabels[3][0], wdaylabels[3][1])
	.text(wdaylabels[4][0], wdaylabels[4][1])
	.text(wdaylabels[5][0], wdaylabels[5][1])
	.text(wdaylabels[6][0], wdaylabels[6][1]);

    /*
     * Days
     */
    for (var d = 1; d <= nd; d++) {
	var ev = event_get? event_get(new Date(year, month - 1, d)) : null;
	var row = ((sd + d - 1) / 7) | 0;
	var col = (sd + d - 1) % 7;
	var color = (ev && ev.holiday)
	    ? "#cc3333" : wdaylabels[col][1].fontColor;
	var x = p1.x + (p1.w / 7)*col;
	var y = (row <= 4)
	    ? p1.y + cy + (ch / 5) * row : p1.y + cy + (ch / 5) * 4.5;
	
	doc.fontSize(24).fillColor(color)
	    .text(d, x + 5, y + 5, {valign: "top", align: "left"});

	if (ev) {
	    // XXX Gothic? consider not Japanese
	    doc.font("Gothic").fontSize(12).fillColor("#000000")
		.text(ev.text, x + 5, y + 25, {valign: "top", align: "left"})
		.font("Helvetica");
	}
    }
    doc.stroke();
}
