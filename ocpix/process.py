# ******************************************************************************************************
# ******************************************************************************************************
#
#	Name:		process.py
#	Date:		19th February 2017
#	Author:		Paul Robson (paul@robsons.org.uk)
#	Purpose:	Ocarina Pictorial Generator. Takes one or more background pics and draws holes on them
#				with the control of a text file.
#
# ******************************************************************************************************
# ******************************************************************************************************

import re
from PIL import Image,ImageDraw

class Processor:
	#
	#	Set up.
	#
	def __init__(self,sourceFile):
		print("Processing "+sourceFile)
		self.directory = sourceFile[:sourceFile.rfind(".")]
		print("In directory "+self.directory)
		self.source = open(sourceFile).readlines()						# read source file and process it
		self.source = [x if x.find(";") < 0 else x[:x.find(";")] for x in self.source]
		self.source = [x.lower().replace("\t"," ").replace(" ","").strip() for x in self.source]
		self.source = [x for x in self.source if x != ""]
		self.currentImage = "(unknown)"									# set up initial values
		self.nextNote = 0 												# next note number. 								
		self.holes = [ None ]											# define holes - no hole 0.
	#
	#	Generate ocarina images
	#
	def generate(self):
		for s in self.source:
			if s[0] == '@':												# @xxxx changes current base image
				self.currentImage = s[1:]
			elif re.match("^\\[\\d+\\,\\d+\\,\\d+\\]$",s) is not None:	# Hole definitions.
				s = [int(x) for x in s[1:-1].split(",")] 				# convert to numbers.
				self.holes.append(s)
				#print(self.holes)
			elif re.match("^[a-g\\#]+\\:\\=[\\+0-9a-z]*$",s) is not None: 	# note definition.
				s = s.split(":=")										# split around the :=
				name="{0}/{1}.png".format(self.directory,self.nextNote)	# target file name
				self.create(self.currentImage,s[1],name,s[0])			# generate image
				self.nextNote += 1 										# bump to next note
			else:
				raise Exception("Unknown line "+s)
		print("Generated {0} images".format(self.nextNote))
		while self.nextNote < 26:										# lots of blank ones to 25
			image = Image.open("empty.png");
			name="{0}/{1}.png".format(self.directory,self.nextNote)
			image.save(name);
			self.nextNote += 1
	#
	#	Create a single OCPIX image
	#
	def create(self,baseImage,holes,targetImage,note):
		print(baseImage,holes,targetImage,note)
		image = Image.open(baseImage) 									# load base
		draw = ImageDraw.Draw(image)									# drawing surface
		for hole in range(1,len(self.holes)): 							# for each hole
			n = holes.find("0123456789abcdefghijklmnopqrstuvwxyz"[hole])# check if covered
			half = False
			if n >= 0 and n < len(holes)-1: 							# if followed by +
				half = (holes[n+1] == '+') 								# its half a hole.				
			self.drawHole(image,draw,self.holes[hole],n >= 0,half)		# draw it.
		del draw 														# tidy up
		image.save(targetImage) 										# save image
	#
	#	Draw a single hole
	#
	def drawHole(self,image,draw,holeDef,isCovered,isHalfCovered):
		sz = image.size													# convert sizes to pixels.
		scaled = [holeDef[0]*sz[0]/100,holeDef[1]*sz[1]/100,holeDef[2]*sz[0]/100/2]
		scaled = [int(x+0.5) for x in scaled] 							# make whole numbers
		scaled[2] = scaled[2] * 2 										# sizes must be even (lots of /2)
		self.drawCircle(draw,scaled[0],scaled[1],scaled[2],isCovered,isHalfCovered)
		#print("",sz,holeDef,scaled,isCovered,isHalfCovered)
	#
	#	Square drawing hole
	#
	def drawSquare(self,draw,x,y,size,isCovered,isHalfCovered):
		draw.rectangle([x-size/2,y-size/2,x+size/2,y+size/2],fill = (0,0,0,255))
		s = max(1,int(size*80/100))
		if not isCovered or isHalfCovered:
			draw.rectangle([x-s/2,y-s/2,x+s/2,y+s/2],fill = (255,255,255,255))
		if isHalfCovered:
			draw.rectangle([x-size/2,y-size/2,x,y+size/2],fill = (0,0,0,255))

	#
	#	Circle drawing hole.
	#
	def drawCircle(self,draw,x,y,size,isCovered,isHalfCovered):
		draw.ellipse([x-size/2,y-size/2,x+size/2,y+size/2],fill = (0,0,0,255))
		s = max(1,int(size*80/100))
		if not isCovered or isHalfCovered:
			draw.ellipse([x-s/2,y-s/2,x+s/2,y+s/2],fill = (255,255,255,255))
		if isHalfCovered:
			draw.pieslice([x-size/2,y-size/2,x+size/2,y+size/2],start = 90,end = 270,fill = (0,0,0,255))
#
#	One object for each set of ocpix.
#
Processor("6-hole.txt").generate()
Processor("4-hole.txt").generate()





