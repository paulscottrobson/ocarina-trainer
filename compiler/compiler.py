
import sys,re

# ************************************************************************************************
#
#										 Compiler Exception
#
# ************************************************************************************************

class CompilerError(Exception):
	pass

# ************************************************************************************************
#
#											  Bar class
#
# ************************************************************************************************

class Bar:
	#
	#	Initialise and create from definition.
	#
	def __init__(self,definition,beats):
		self.notes = []
		self.quarterPos = 0
		self.modifiers = { "=":-3,"o":4,"-":-2,".":2 }	# Modifiers.
	#
	#	Create Rendering for a bar
	#
	def render(self):
		render = ""
		return render

# ************************************************************************************************
#
#											Compiler class
#
# ************************************************************************************************

class MandolinCompiler:
	#
	#	Reset the compiler
	#
	def reset(self):
		self.header = { "name":"<unknown>","author":"<unknown>","beats":"4","speed":"100" }
		self.headerNumbers = [ "beats","speed" ]
		self.bars = []
		self.lineNumber = 0
	#
	#	Load and pre-process source
	#
	def load(self,source):
		self.source = [x if x.find("//") < 0 else x[:x.find("//")] for x in open(source).readlines()]
		self.source = [x.replace("\t"," ").strip() for x in self.source]
		for assign in [x for x in self.source if x.find(":=") >= 0]:
			parts = [x.strip() for x in assign.split(":=")]
			if len(parts) != 2 or parts[0].lower() not in self.header:
				raise CompilerError("Bad assignment '"+assign+"'")
			self.header[parts[0].lower()] = parts[1]
		self.source = [x if x.find(":=") < 0 else "" for x in self.source]
	#
	#	Compile all the bars.
	#
	def compileBars(self):
		for n in range(0,len(self.source)):
			self.lineNumber = n + 1
			for barDef in [x.replace(" ","") for x in self.source[n].split("|")]:
				if barDef != "":
					self.bars.append(Bar(barDef,int(self.header["beats"])))
					print(barDef,self.bars[-1].notes)
					#print('"'+self.bars[-1].render(int(self.header["beats"]))+'"')
	#
	#	Render the JSON.
	#
	def render(self,handle):
		handle.write("{\n")
		keys = [x for x in self.header.keys()]
		keys.sort()
		for k in keys:
			handle.write('    "{0}":{1},\n'.format(k,self.header[k] if k in self.headerNumbers else '"'+self.header[k]+'"'))
		handle.write('    "bars":[')			
		handle.write(",".join(['\n                "'+x.render()+'"' for x in self.bars]))
		handle.write("\n           ]\n}\n")
	#
	#	Render to a file
	#
	def renderFile(self,jsonFile):
		handle = open(jsonFile,"w")
		self.render(handle)
		handle.close()

if __name__ == '__main__':
	c = MandolinCompiler()	
	c.reset()	
	c.load("camptown.oc1")
	c.compileBars()
	c.render(sys.stdout)
	c.renderFile("../app/music.json")
