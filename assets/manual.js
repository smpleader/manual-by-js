function ManualByJs(options = {}){
    this.version = '0.1.1'
    this.flag = options.flag || ''
    this.folderContent = options.folderContent || 'content'
    this.siteTitle = options.siteTitle || 'Manual By JS'
    this.index = options.index || 'home'
    this.current = {}
    this.next = {}
    this.prev = {}
    this.menu = []
}

ManualByJs.prototype = {
    read: function(page){
        that = this
        fetch(this.folderContent + '/' + page + '.html')
        .then(response => response.text())
        .then(data => {
            var div = document.getElementById('mbj-page') 
            div.innerHTML = ""
            div.insertAdjacentHTML("afterbegin", data) 
            that.createIndex()
        })
        .catch(error => {
            alert('Can not get page content "'+ page + '"!')
            console.error('Error fetching the file  page', error);
        });
    },
    findPage: function(idx, step)
    {
        finder = idx + step
        if(finder < 0 || finder == this.menu.length ) return false
        test = this.menu[finder]
        return test.slug ?  test : this.findPage(finder, step)
    },
    navigate: async function(hash){
        that = this
        for(var ind = 0; ind < that.menu.length; ind++)
        {
            item = that.menu[ind]
            if(item.slug && hash == item.slug)
            {   
                const menu =  document.getElementById("mbj-menu");
                const anchors = menu.getElementsByTagName('a');
                for(const m of anchors)
                {
                    if(m.classList.contains(item.slug))
                    {
                        m.classList.add("active")
                    }
                    else
                    {
                        m.classList.remove("active")
                    }
                }
                
                that.current = item
                if(item.alias) {
                    await that.read(item.alias)
                } else {
                    await that.read(item.slug)
                }
                
                var div = document.getElementById('mbj-page-nav')
                div.innerHTML = ""
                that.prev = that.findPage(ind, -1)
                if(false == that.prev)
                {
                    div.insertAdjacentHTML("afterbegin", '<a class="invisible"><span>.</span></a>')
                } 
                else 
                {
                    div.insertAdjacentHTML("afterbegin", 
                        '<a href="#'+that.prev.slug+'" class="">' +
                            '<span>Previous page</span>' +
                            that.prev.title +
                        '</a>');
                }

                that.next = that.findPage(ind, 1)

                if(false !==  that.next)
                {
                    div.insertAdjacentHTML("beforeend", 
                        '<a href="#'+that.next.slug+'" class="text-end">' +
                            '<span>Next page</span>' +
                            that.next.title +
                        '</a>');
                } 
                break;
            }
        }
    }, 
    init: async function(callable){
        that = this

        window.addEventListener('hashchange', function() {
            const hash = window.location.hash.substring(1); // Remove the '#' character
            that.navigate(hash);
        });
        
        fetch(this.folderContent + '/menu.json')
        .then(response => response.text())
        .then(data => {
            that.menu = JSON.parse(data)
            that.createMenu()
            
            if(typeof callable == 'function') callable()
                
            let hash = window.location.hash.substring(1);
            if(hash.length == 0) hash = that.index
            
            that.navigate( hash )

            document.getElementById('mbj-site-title').innerText = that.siteTitle
        })
        .catch(error => {
            alert('Can not create menu!')
            console.error('Error fetching the file  menu', error);
        });
    },
    createMenu: function() {
        for(const item of this.menu)
        {
            var div = document.getElementById('mbj-menu')
            var line = item.slug ? 
                '<a href="#'+ item.slug +'" class="'+ item.slug +'">'+ item.title +'</a>' :
                '<h6><strong>'+ item.title+'</strong></h6>'
            div.insertAdjacentHTML("beforeend", line)
        }
    },
    createIndex: function()  {
        var div = document.getElementById('mbj-index')
        div.innerHTML = ""
        if(this.current.index)
        { 
            div.insertAdjacentHTML("beforeend", '<li class="mt-3"><b>On this page</b></li>')
            for(const item of this.current.index)
            {
                if(typeof item == "string")
                {
                    let name = item.charAt(0).toUpperCase() + item.slice(1);
                    name = name.replace(/-_/g, ' ')
                    div.insertAdjacentHTML("beforeend", '<li><a class="item" href="#'+item+'">'+name+'</a></li>')

                }
                else if( item.id && item.name)
                {
                    div.insertAdjacentHTML("beforeend", '<li><a class="item" href="#'+item.id+'">'+item.name+'</a></li>')
                }
            }
        }
        
    },
    test: function()
    {
        console.log('test', this.menu)
    }
}